"""
Vector Store management for RAG
Handles embeddings and similarity search
"""
from typing import List, Dict, Optional
import os

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from config.settings import VECTOR_STORE_PATH, EMBEDDINGS_MODEL, PDF_CHUNK_SIZE


class VectorStore:
    """Vector store for managing embeddings and similarity search"""
    
    def __init__(self):
        """Initialize vector store"""
        if not CHROMA_AVAILABLE:
            raise ImportError("chromadb not installed. Install with: pip install chromadb")
        
        self.client = chromadb.PersistentClient(path=str(VECTOR_STORE_PATH))
        self.collection = None
    
    def get_or_create_collection(self, name: str = "research_papers"):
        """Get or create a collection"""
        self.collection = self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )
        return self.collection
    
    def add_documents(self, pdf_id: str, chunks: List[Dict], metadatas: List[Dict]):
        """
        Add document chunks to vector store.
        
        Args:
            pdf_id: PDF identifier
            chunks: List of text chunks
            metadatas: List of metadata dicts for each chunk
        """
        if not self.collection:
            self.get_or_create_collection()
        
        # Generate IDs
        ids = [f"{pdf_id}_chunk_{i}" for i in range(len(chunks))]
        
        # Add to collection
        self.collection.add(
            ids=ids,
            documents=chunks,
            metadatas=metadatas
        )
    
    def query(self, query: str, pdf_id: str = None, top_k: int = 5) -> List[Dict]:
        """
        Query vector store for similar documents.
        
        Args:
            query: Query string
            pdf_id: Optional PDF ID to filter results
            top_k: Number of top results
        
        Returns:
            List of similar chunks with scores
        """
        if not self.collection:
            self.get_or_create_collection()
        
        # Build where filter if pdf_id provided
        where = None
        if pdf_id:
            where = {"pdf_id": {"$eq": pdf_id}}
        
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where
        )
        
        # Format results
        formatted = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                formatted.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i],
                    "score": 1 - (results["distances"][0][i] / 2)  # Convert distance to similarity
                })
        
        return formatted
    
    def delete_pdf(self, pdf_id: str):
        """Delete all chunks for a PDF"""
        if not self.collection:
            return
        
        # This is a limitation of Chroma - we need to know the IDs
        # Better approach: filter by metadata
        self.collection.delete(
            where={"pdf_id": {"$eq": pdf_id}}
        )


# Global instance
_vector_store = None


def get_vector_store() -> VectorStore:
    """Get or create vector store instance"""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store


def query_vector_store(query: str, pdf_id: str = None, top_k: int = 5) -> List[Dict]:
    """
    Query the vector store (convenience function).
    
    Args:
        query: Query string
        pdf_id: Optional PDF ID to filter
        top_k: Number of results
    
    Returns:
        List of similar chunks
    """
    store = get_vector_store()
    return store.query(query, pdf_id=pdf_id, top_k=top_k)


def add_to_vector_store(pdf_id: str, chunks: List[str], metadatas: List[Dict]):
    """
    Add document chunks to vector store.
    
    Args:
        pdf_id: PDF identifier
        chunks: List of text chunks
        metadatas: Metadata for each chunk
    """
    store = get_vector_store()
    store.add_documents(pdf_id, chunks, metadatas)
