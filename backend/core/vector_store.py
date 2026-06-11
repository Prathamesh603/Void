"""
Vector Store management for RAG
Handles embeddings and similarity search (Chroma & Qdrant)
"""
import asyncio
import uuid
from typing import List, Dict, Optional
import os

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

try:
    import qdrant_client
    from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

from config.settings import (
    VECTOR_STORE_PATH,
    EMBEDDINGS_MODEL,
    PDF_CHUNK_SIZE,
    VECTOR_STORE_TYPE,
    QDRANT_API_KEY,
    QDRANT_URL
)


class VectorStore:
    """Vector store for managing embeddings and similarity search"""

    def __init__(self):
        """Initialize vector store"""
        self.store_type = VECTOR_STORE_TYPE.lower()
        self._model = None
        self.collection = None

        if self.store_type == "qdrant":
            if not QDRANT_AVAILABLE:
                raise ImportError("qdrant-client not installed. Install with: pip install qdrant-client")
            if not QDRANT_URL:
                raise ValueError("QDRANT_URL is not configured in settings/environment variables.")

            self.client = qdrant_client.QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY
            )
        else:
            if not CHROMA_AVAILABLE:
                raise ImportError("chromadb not installed. Install with: pip install chromadb")
            self.client = chromadb.PersistentClient(path=str(VECTOR_STORE_PATH))

    def _get_embedding_model(self):
        """Lazy load the embedding model to improve server startup time"""
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(EMBEDDINGS_MODEL)
        return self._model

    def get_or_create_collection(self, name: str = "research_papers"):
        """Get or create a collection/index"""
        if self.store_type == "qdrant":
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            if name not in collection_names:
                dimensions = 384
                try:
                    model = self._get_embedding_model()
                    dimensions = model.get_sentence_embedding_dimension()
                except Exception:
                    pass

                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(size=dimensions, distance=Distance.COSINE)
                )

            try:
                from qdrant_client.models import PayloadSchemaType
                self.client.create_payload_index(
                    collection_name=name,
                    field_name="pdf_id",
                    field_schema=PayloadSchemaType.KEYWORD
                )
            except Exception:
                pass

            self.collection = name
            return self.collection
        else:
            self.collection = self.client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
            return self.collection

    def add_documents(self, pdf_id: str, chunks: List[str], metadatas: List[Dict]):
        """
        Add document chunks to vector store.

        Args:
            pdf_id: PDF identifier
            chunks: List of text chunks
            metadatas: List of metadata dicts for each chunk
        """
        if not self.collection:
            self.get_or_create_collection()

        if self.store_type == "qdrant":
            model = self._get_embedding_model()
            embeddings = model.encode(chunks).tolist()

            points = []
            for i, (chunk, metadata) in enumerate(zip(chunks, metadatas)):
                payload = dict(metadata)
                payload["pdf_id"] = pdf_id
                payload["text"] = chunk

                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{pdf_id}_chunk_{i}"))

                points.append(PointStruct(
                    id=point_id,
                    vector=embeddings[i],
                    payload=payload
                ))

            self.client.upsert(
                collection_name=self.collection,
                points=points
            )
        else:
            ids = [f"{pdf_id}_chunk_{i}" for i in range(len(chunks))]

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
            pdf_id: Optional PDF ID to filter results (for RAG scoped to a specific paper)
            top_k: Number of top results

        Returns:
            List of similar chunks with scores
        """
        if not self.collection:
            self.get_or_create_collection()

        if self.store_type == "qdrant":
            model = self._get_embedding_model()
            query_vector = model.encode(query).tolist()

            query_filter = None
            if pdf_id:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="pdf_id",
                            match=MatchValue(value=pdf_id)
                        )
                    ]
                )

            results = self.client.search(
                collection_name=self.collection,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k
            )

            formatted = []
            for hit in results:
                payload = hit.payload or {}
                doc_text = payload.get("text", "")

                metadata = {k: v for k, v in payload.items() if k != "text"}

                formatted.append({
                    "content": doc_text,
                    "metadata": metadata,
                    "score": hit.score
                })

            return formatted
        else:
            where = None
            if pdf_id:
                where = {"pdf_id": {"$eq": pdf_id}}

            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                where=where
            )

            formatted = []
            if results and results["documents"]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted.append({
                        "content": doc,
                        "metadata": results["metadatas"][0][i],
                        "score": 1 - (results["distances"][0][i] / 2)
                    })

            return formatted

    def delete_pdf(self, pdf_id: str):
        """Delete all chunks for a PDF"""
        if not self.collection:
            return

        if self.store_type == "qdrant":
            self.client.delete(
                collection_name=self.collection,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="pdf_id",
                            match=MatchValue(value=pdf_id)
                        )
                    ]
                )
            )
        else:
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


async def query_vector_store(query: str, pdf_id: str = None, top_k: int = 5) -> List[Dict]:
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
    return await asyncio.to_thread(store.query, query, pdf_id, top_k)


async def add_to_vector_store(pdf_id: str, chunks: List[str], metadatas: List[Dict]):
    """
    Add document chunks to vector store.

    Args:
        pdf_id: PDF identifier
        chunks: List of text chunks
        metadatas: Metadata for each chunk
    """
    store = get_vector_store()
    await asyncio.to_thread(store.add_documents, pdf_id, chunks, metadatas)
