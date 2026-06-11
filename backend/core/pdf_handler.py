"""
PDF handling and processing
"""
import asyncio
from typing import List, Tuple
import httpx
from pathlib import Path

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

from config.settings import PDF_DIR, PDF_CHUNK_SIZE, PDF_CHUNK_OVERLAP


def _write_pdf_file(pdf_path: Path, content: bytes):
    with open(pdf_path, "wb") as f:
        f.write(content)


async def download_pdf(pdf_url: str, pdf_id: str) -> Path:
    """
    Download PDF from URL and save locally.

    Args:
        pdf_url: URL to PDF
        pdf_id: ID for the PDF file

    Returns:
        Path to saved PDF
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(pdf_url)
            response.raise_for_status()

        pdf_path = PDF_DIR / f"{pdf_id}.pdf"
        await asyncio.to_thread(_write_pdf_file, pdf_path, response.content)

        return pdf_path

    except Exception as e:
        raise Exception(f"Failed to download PDF: {str(e)}")


def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract text from PDF file.

    Args:
        pdf_path: Path to PDF file

    Returns:
        Extracted text content
    """
    if not PDF_AVAILABLE:
        raise ImportError("PyPDF2 not installed. Install with: pip install PyPDF2")

    try:
        with open(pdf_path, "rb") as f:
            header = f.read(4)
            if header != b"%PDF":
                f.seek(0)
                sample = f.read(1024).decode('utf-8', errors='ignore')
                if "<html" in sample.lower() or "<!doctype" in sample.lower():
                    raise ValueError(
                        "The downloaded file is an HTML page (likely a landing page, captcha, or error page) "
                        "instead of a PDF. Please ensure the URL links directly to the PDF binary (e.g. ending in '.pdf')."
                    )
                raise ValueError("The file does not start with the standard PDF header (%PDF).")

        text = ""
        with open(pdf_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f, strict=False)

            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page.extract_text()

        return text

    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def chunk_text(text: str, chunk_size: int = PDF_CHUNK_SIZE,
               overlap: int = PDF_CHUNK_OVERLAP) -> List[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: Full text to chunk
        chunk_size: Size of each chunk
        overlap: Overlap between chunks

    Returns:
        List of text chunks
    """
    chunks = []

    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if chunk.strip():
            chunks.append(chunk)

    return chunks


async def process_pdf(pdf_url: str, pdf_id: str, title: str) -> Tuple[List[str], List[dict]]:
    """
    Complete PDF processing pipeline:
    1. Download PDF
    2. Extract text
    3. Split into chunks
    4. Create metadata

    Args:
        pdf_url: URL to PDF
        pdf_id: PDF identifier
        title: PDF title for metadata

    Returns:
        Tuple of (chunks, metadatas)
    """

    pdf_path = await download_pdf(pdf_url, pdf_id)
    text = await asyncio.to_thread(extract_text_from_pdf, pdf_path)
    chunks = await asyncio.to_thread(chunk_text, text)

    metadatas = [
        {
            "pdf_id": pdf_id,
            "title": title,
            "chunk_index": i,
            "source": "arxiv"
        }
        for i in range(len(chunks))
    ]

    return chunks, metadatas


async def delete_pdf(pdf_id: str):
    """
    Delete PDF file from storage.

    Args:
        pdf_id: PDF identifier
    """
    pdf_path = PDF_DIR / f"{pdf_id}.pdf"
    if pdf_path.exists():
        await asyncio.to_thread(pdf_path.unlink)
