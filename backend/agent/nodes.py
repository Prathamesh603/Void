"""
Graph node definitions for the research agent
Each node is a function that processes state
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from config.settings import LLM_MODEL, LLM_TEMPERATURE, GROQ_API_KEY, GEMINI_API_KEY
from agent.state import AgentState
from agent.tools import tools
from langchain_google_genai import ChatGoogleGenerativeAI



if LLM_MODEL == 'GEMINI':
    # Gemini Model
    llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY
)
else:
    # GROQ 
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
        content="""You are an AI Research & Reasoning Assistant powered by LangGraph and tools.

You are not just a search-based assistant — you are a reasoning engine that:
- understands context deeply
- connects ideas across steps
- handles follow-up questions naturally
- refines or corrects earlier answers when needed

---

# Tools
- arxiv_tool → find new research papers (only when user searches for papers)
- wiki_tool → general knowledge and concepts
- tavily_tool → latest news / web info
- rag_tool → documents already stored in session

---

# Tool Rules (STRICT)
- If paper excerpts/context are provided → DO NOT use tools, answer directly
- If user refers to stored paper → use rag_tool
- If user searches new research → use arxiv_tool
- If general concept → use wiki_tool
- If real-time info → use tavily_tool

---

# Reasoning Behavior (IMPORTANT)
- Break down problems step-by-step internally before answering
- For follow-up questions, maintain context and build on previous answers
- If user asks something unclear, infer intent but stay logically grounded
- You may compare, critique, or improve previous responses if needed

---

# Response Style
- Use clean Markdown
- Be structured, concise, and technical
- Prefer bullets and sections over long paragraphs
- Always explain “why”, not just “what”

Format:
## Summary
## Key Points
## Explanation
## Sources (if any)

---

# Core Identity
You are a hybrid of:
- Research assistant (information retrieval)
- Reasoning agent (multi-step thinking)
- Technical explainer (clear structured answers)"""
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
