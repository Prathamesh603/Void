"""
Graph node definitions for the research agent
Each node is a function that processes state
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from config.settings import LLM_MODEL, LLM_TEMPERATURE, GROQ_API_KEY
from agent.state import AgentState
from agent.tools import tools


# Initialize LLM
llm = ChatGroq(
    model=LLM_MODEL,
    temperature=LLM_TEMPERATURE,
    api_key=GROQ_API_KEY
)

# Bind tools to LLM
llm_with_tools = llm.bind_tools(tools)


# =========================
# CHATBOT NODE
# =========================

async def chatbot_node(state: AgentState):
    """
    Main chatbot node that processes messages and decides which tools to use.

    The LLM reads:
    - Previous conversation messages
    - Available tools (arxiv, wiki, tavily, rag)
    - Automatically decides which tool(s) to call

    Returns:
        Updated state with new message from LLM
    """

    system_prompt = SystemMessage(
        content="""You are an intelligent research assistant powered by LangGraph and multiple tools.

You have access to these tools:
1. arxiv_tool - Search for NEW academic papers on ArXiv (use ONLY when user wants to FIND or SEARCH for new papers they don't have yet)
2. wiki_tool - Get information from Wikipedia
3. tavily_tool - Search latest news and web content
4. rag_tool - Retrieve information from PDFs already stored/downloaded in the session (use when user asks about a specific paper they already have)

CRITICAL Instructions for tool selection:
- If the user message contains "Relevant excerpts from the paper" or paper context is already provided in the message, DO NOT call any tool. Answer directly from the provided excerpts.
- If the user asks about a paper they already have in their session (e.g., asking about content, methodology, findings of a stored paper): Use rag_tool
- If the user wants to SEARCH for new papers on a topic: Use arxiv_tool
- For general information: Use wiki_tool
- For latest news/current info: Use tavily_tool
- You can use multiple tools in one response if needed
- Always provide citations and sources
- Format responses clearly with markdown when appropriate

Be helpful, accurate, and thorough in your responses."""
    )

    messages = state.get("messages", [])

    response = await llm_with_tools.ainvoke(
        [system_prompt] + messages
    )

    return {
        "messages": [response]
    }


# =========================
# CONDITIONAL ROUTING
# =========================

def should_continue(state: AgentState):
    """
    Conditional edge to determine if tools should be executed.

    Returns:
        "tools" - if LLM made tool calls
        "end" - if LLM responded directly without tool calls
    """

    messages = state.get("messages", [])

    if not messages:
        return "end"

    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    return "end"
