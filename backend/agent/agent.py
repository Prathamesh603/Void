"""
LangGraph agent compilation and execution
"""
import asyncio
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import SystemMessage, ToolMessage
from agent.state import AgentState
from agent.tools import tools
from agent.nodes import chatbot_node, should_continue
# from agent.state import state
from langchain_core.messages import SystemMessage
from config.settings import RESEARCH_SYSTEM_PROMPT

def create_tool_node_with_session(tools_list):
    """
    Custom tool node that automatically injects session_id from state.

    The LLM only knows about: arxiv_tool(query, max_results)
    This wrapper adds session_id from state before calling the tool.

    This solves the problem: LLM doesn't need to know about session_id,
    but the tools can still access it from the state context.
    """
    async def tool_node_with_session(state: AgentState):
        """
        Execute tools with session context automatically injected.

        Args:
            state: Contains messages with tool calls AND session_id

        Returns:
            Updated state with tool results as ToolMessages
        """
        messages = state.get("messages", [])
        session_id = state.get("session_id")

        if not messages:
            return {"messages": []}

        last_message = messages[-1]

        if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
            return {"messages": []}

        async def execute_tool_call(tool_call):
            tool_name = tool_call["name"]
            tool_input = dict(tool_call["args"])

            if tool_name in ["arxiv_tool", "tavily_tool"] and session_id:
                tool_input["session_id"] = session_id

            tool_func = None
            for tool in tools_list:
                if tool.name == tool_name:
                    tool_func = tool
                    break

            if tool_func:
                try:
                    result = await tool_func.ainvoke(tool_input)
                    return ToolMessage(
                        content=str(result),
                        tool_call_id=tool_call["id"],
                        name=tool_name
                    )
                except Exception as e:
                    return ToolMessage(
                        content=f"Error executing tool: {str(e)}",
                        tool_call_id=tool_call["id"],
                        name=tool_name
                    )
            return None

        tool_results = await asyncio.gather(
            *[execute_tool_call(tool_call) for tool_call in last_message.tool_calls]
        )

        return {"messages": [result for result in tool_results if result is not None]}

    return tool_node_with_session


def create_agent_graph():
    """
    Create and compile the research agent graph.

    Flow:
    START → chatbot_node → should_continue?
                              ├─ YES → ToolNode (with session injection) → chatbot_node (loop)
                              └─ NO  → END

    The custom tool node automatically injects session_id from state,
    so the LLM doesn't need to know about it.

    Returns:
        Compiled graph with memory checkpointing
    """

    graph_builder = StateGraph(AgentState)

    graph_builder.add_node("chatbot", chatbot_node)

    tool_node = create_tool_node_with_session(tools)
    graph_builder.add_node("tools", tool_node)

    graph_builder.add_edge(START, "chatbot")

    graph_builder.add_conditional_edges(
        "chatbot",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )

    graph_builder.add_edge("tools", "chatbot")

    memory = MemorySaver()
    graph = graph_builder.compile(checkpointer=memory)

    return graph


# Create agent
agent = create_agent_graph()


async def invoke_agent(state: AgentState, session_id: str):
    """
    Invoke the agent with a session ID for persistent memory.

    Args:
        state: Current agent state
        session_id: Unique session ID for checkpointing

    Returns:
        Result from graph invocation
    """

    if not any(
        isinstance(msg, SystemMessage)
        for msg in state["messages"]
    ):
        state["messages"].insert(
        0,
        SystemMessage(content=RESEARCH_SYSTEM_PROMPT)
        )
    # Add session ID to state for debugging
    result = await agent.ainvoke(
        state,
        config={
            "configurable": {
                "thread_id": session_id
            }
        }
    )

    return result
