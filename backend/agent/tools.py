"""
Tool definitions for the research agent
Each tool is decorated with @tool and can be used by LLM via tool calling
"""
import asyncio
from langchain_core.tools import tool
import arxiv
import wikipedia
from tavily import TavilyClient
from core.vector_store import query_vector_store
from core.database_manager import db
from config.settings import TAVILY_API_KEY


# =========================
# ARXIV TOOL
# =========================

def _arxiv_search_sync(query: str, max_results: int, session_id: str = None):
    client = arxiv.Client(
        page_size=3,
        delay_seconds=3,
        num_retries=3
    )

    search = arxiv.Search(
        query=query,
        max_results=max_results
    )

    papers_for_llm = []

    for result in client.results(search):
        arxiv_id = result.entry_id.split('/abs/')[-1]
        authors = ", ".join([author.name for author in result.authors[:3]])
        published_date = str(result.published.date())
        full_summary = result.summary

        papers_for_llm.append({
            "title": result.title,
            "pdf_url": result.pdf_url,
            "summary": full_summary[:200] + "..." if len(full_summary) > 200 else full_summary,
            "arxiv_id": arxiv_id,
            "_arxiv_id": arxiv_id,
            "_full_summary": full_summary,
            "_authors": authors,
            "_published_date": published_date,
        })

    return papers_for_llm


async def _save_arxiv_papers(papers_for_llm, session_id: str):
    for paper in papers_for_llm:
        max_retries = 3
        retry_count = 0
        saved = False

        while retry_count < max_retries and not saved:
            try:
                await db.save_paper(
                    session_id=session_id,
                    arxiv_id=paper["_arxiv_id"],
                    title=paper["title"],
                    summary=paper["_full_summary"],
                    pdf_url=paper["pdf_url"],
                    authors=paper["_authors"],
                    published_date=paper["_published_date"]
                )
                saved = True
            except Exception as db_error:
                retry_count += 1
                if "UNIQUE constraint" in str(db_error):
                    break
                if retry_count < max_retries:
                    wait_time = 0.5 * (2 ** retry_count)
                    await asyncio.sleep(wait_time)
                else:
                    print(
                        f"Warning: Could not save paper {paper['_arxiv_id']} "
                        f"after {max_retries} retries: {str(db_error)}"
                    )


@tool
async def arxiv_tool(query: str, max_results: int = 3, session_id: str = None):
    """
    Search for research papers on ArXiv.

    Use this when user asks about research papers, academic publications,
    or scientific papers on a topic.

    Args:
        query: Search query (e.g., "transformers", "attention mechanism")
        max_results: Number of results to return (default 3)
        session_id: Session ID to store papers in database (optional)

    Returns:
        List of papers with title, summary, and PDF URL (minimal info for LLM).
        Full metadata is stored in database.
    """
    try:
        papers_raw = await asyncio.to_thread(
            _arxiv_search_sync, query, max_results, session_id
        )

        if session_id and papers_raw:
            await _save_arxiv_papers(papers_raw, session_id)

        papers_for_llm = [
            {
                "title": p["title"],
                "pdf_url": p["pdf_url"],
                "summary": p["summary"],
                "arxiv_id": p["arxiv_id"],
            }
            for p in papers_raw
        ]

        return {
            "status": "success",
            "count": len(papers_for_llm),
            "papers": papers_for_llm,
            "note": "Full metadata stored in database"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"ArXiv search failed: {str(e)} use other tool"
        }


# =========================
# WIKIPEDIA TOOL
# =========================

def _wiki_search_sync(query: str, sentences: int):
    return wikipedia.summary(query, sentences=sentences)


@tool
async def wiki_tool(query: str, sentences: int = 3):
    """
    Search for information on Wikipedia.

    Use this when user asks for general information, definitions,
    or background knowledge about a topic.

    Args:
        query: Search query (e.g., "machine learning", "neural networks")
        sentences: Number of sentences to return (default 3)

    Returns:
        Wikipedia summary and related information
    """
    try:
        summary = await asyncio.to_thread(_wiki_search_sync, query, sentences)

        return {
            "status": "success",
            "query": query,
            "summary": summary[:500]
        }

    except wikipedia.exceptions.DisambiguationError as e:
        return {
            "status": "disambiguation",
            "message": f"Multiple results found for '{query}'",
            "options": e.options[:5]
        }

    except wikipedia.exceptions.PageError:
        return {
            "status": "error",
            "message": f"Page not found for '{query}'"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Wikipedia search failed: {str(e)}"
        }


# =========================
# TAVILY TOOL
# =========================

tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None


def _tavily_search_sync(query: str, max_results: int):
    return tavily_client.search(query=query, max_results=max_results)


@tool
async def tavily_tool(query: str, max_results: int = 3, session_id: str = None):
    """
    Search the internet for latest news and web content using Tavily.

    Use this when user asks about latest news, current events,
    or recent information about a topic.

    Args:
        query: Search query (e.g., "latest AI news", "transformers breakthrough")
        max_results: Number of results to return (default 3)
        session_id: Session ID for optional storage (optional)

    Returns:
        List of web results with title, content, and URL (minimal info for LLM).
        Full metadata is stored in database.
    """

    if not tavily_client:
        return {
            "status": "error",
            "message": "Tavily API key not configured"
        }

    try:
        response = await asyncio.to_thread(_tavily_search_sync, query, max_results)

        results_for_llm = []
        for item in response.get("results", [])[:max_results]:
            content_preview = item["content"][:150] + "..." if len(item["content"]) > 150 else item["content"]
            results_for_llm.append({
                "title": item["title"],
                "content": content_preview,
                "url": item["url"]
            })

        return {
            "status": "success",
            "count": len(results_for_llm),
            "results": results_for_llm
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Tavily search failed: {str(e)}"
        }


# =========================
# RAG TOOL - Retrieve from stored PDFs
# =========================

@tool
async def rag_tool(query: str, pdf_id: str = None):
    """
    Retrieve relevant information from stored PDFs using RAG (Retrieval Augmented Generation).

    Use this when:
    - User asks questions about papers, PDFs, or files stored in their session
    - User asks to explain concepts from specific papers already uploaded/downloaded
    - User wants to compare information across papers in their session

    Args:
        query: Question or search query (e.g., "What is attention mechanism?")
        pdf_id: Optional specific PDF ID to search in. If None, searches all PDFs in session

    Returns:
        Relevant text chunks from PDFs with source information
    """

    try:
        top_k = 5
        results = await query_vector_store(
            query=query,
            pdf_id=pdf_id,
            top_k=top_k
        )

        if not results:
            return {
                "status": "no_results",
                "message": "No relevant information found in stored PDFs"
            }

        chunks = []
        for result in results:
            chunks.append({
                "content": result["content"],
                "source": result["metadata"].get("title", "Unknown"),
                "page": result["metadata"].get("page", "N/A"),
                "relevance_score": f"{result['score']:.2f}"
            })

        return {
            "status": "success",
            "chunks_found": len(chunks),
            "chunks": chunks
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"RAG retrieval failed: {str(e)}"
        }


# Register all tools
tools = [arxiv_tool, wiki_tool, tavily_tool, rag_tool]
