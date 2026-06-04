"""
LangGraph agent compilation and execution
"""
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import ToolMessage
from agent.state import AgentState
from agent.tools import tools
from agent.nodes import chatbot_node, should_continue


def create_tool_node_with_session(tools_list):
    """
    Custom tool node that automatically injects session_id from state.
    
    The LLM only knows about: arxiv_tool(query, max_results)
    This wrapper adds session_id from state before calling the tool.
    
    This solves the problem: LLM doesn't need to know about session_id,
    but the tools can still access it from the state context.
    """
    def tool_node_with_session(state: AgentState):
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
        
        # Check if there are tool calls
        if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
            return {"messages": []}
        
        # Process each tool call
        tool_results = []
        
        for tool_call in last_message.tool_calls:
            tool_name = tool_call["name"]
            tool_input = tool_call["args"]
            
            # Inject session_id for arxiv and tavily tools
            if tool_name in ["arxiv_tool", "tavily_tool"] and session_id:
                tool_input["session_id"] = session_id
            
            # Find and invoke the tool
            tool_func = None
            for tool in tools_list:
                if tool.name == tool_name:
                    tool_func = tool
                    break
            
            if tool_func:
                try:
                    result = tool_func.invoke(tool_input)
                    tool_results.append(
                        ToolMessage(
                            content=str(result),
                            tool_call_id=tool_call["id"],
                            name=tool_name
                        )
                    )
                except Exception as e:
                    tool_results.append(
                        ToolMessage(
                            content=f"Error executing tool: {str(e)}",
                            tool_call_id=tool_call["id"],
                            name=tool_name
                        )
                    )
        
        return {"messages": tool_results}
    
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
    
    # Create graph builder
    graph_builder = StateGraph(AgentState)
    
    # Add nodes
    graph_builder.add_node("chatbot", chatbot_node)
    
    # Use custom tool node that injects session_id
    tool_node = create_tool_node_with_session(tools)
    graph_builder.add_node("tools", tool_node)
    
    # Add edges
    graph_builder.add_edge(START, "chatbot")
    
    # Conditional routing based on whether tools were called
    graph_builder.add_conditional_edges(
        "chatbot",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    
    # Tools loop back to chatbot for final response
    graph_builder.add_edge("tools", "chatbot")
    
    # Compile with memory for multi-turn sessions
    memory = MemorySaver()
    graph = graph_builder.compile(checkpointer=memory)
    
    return graph


# Create agent
agent = create_agent_graph()


def invoke_agent(state: AgentState, session_id: str):
    """
    Invoke the agent with a session ID for persistent memory.
    
    Args:
        state: Current agent state
        session_id: Unique session ID for checkpointing
    
    Returns:
        Result from graph invocation
    """
    
    result = agent.invoke(
        state,
        config={
            "configurable": {
                "thread_id": session_id
            }
        }
    )
    
    return result