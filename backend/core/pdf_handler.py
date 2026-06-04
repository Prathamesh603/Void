"""
PDF handling and processing
"""
from typing import List, Tuple
import requests
from pathlib import Path

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

from config.settings import PDF_DIR, PDF_CHUNK_SIZE, PDF_CHUNK_OVERLAP


def download_pdf(pdf_url: str, pdf_id: str) -> Path:
    """
    Download PDF from URL and save locally.
    
    Args:
        pdf_url: URL to PDF
        pdf_id: ID for the PDF file
    
    Returns:
        Path to saved PDF
    """
    try:
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()
        
        pdf_path = PDF_DIR / f"{pdf_id}.pdf"
        
        with open(pdf_path, "wb") as f:
            f.write(response.content)
        
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
        text = ""
        
        with open(pdf_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            
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
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk)
    
    return chunks


def process_pdf(pdf_url: str, pdf_id: str, title: str) -> Tuple[List[str], List[dict]]:
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
    
    # Download
    pdf_path = download_pdf(pdf_url, pdf_id)
    
    # Extract text
    text = extract_text_from_pdf(pdf_path)
    
    # Chunk text
    chunks = chunk_text(text)
    
    # Create metadata for each chunk
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


def delete_pdf(pdf_id: str):
    """
    Delete PDF file from storage.
    
    Args:
        pdf_id: PDF identifier
    """
    pdf_path = PDF_DIR / f"{pdf_id}.pdf"
    if pdf_path.exists():
        pdf_path.unlink()
