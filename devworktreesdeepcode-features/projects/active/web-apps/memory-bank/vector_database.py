#!/usr/bin/env python3
"""
Vector Database Integration Module
Provides semantic search capabilities using FAISS and ChromaDB
Production-grade implementation with 2025 best practices
"""

import asyncio
import hashlib
import json
import logging
import os
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union, Any
from datetime import datetime

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
from tenacity import retry, stop_after_attempt, wait_exponential

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorDBType(Enum):
    """Supported vector database types"""
    FAISS = "faiss"
    CHROMA = "chroma"
    HYBRID = "hybrid"  # Use both for different purposes

class IndexType(Enum):
    """FAISS index types for different use cases"""
    FLAT = "flat"  # Exact search, best for small datasets
    IVF = "ivf"  # Inverted file index, good for medium datasets
    HNSW = "hnsw"  # Hierarchical Navigable Small World, best for large datasets
    LSH = "lsh"  # Locality Sensitive Hashing, good for memory efficiency

@dataclass
class VectorSearchResult:
    """Result from vector similarity search"""
    id: str
    score: float
    metadata: Dict[str, Any]
    vector: Optional[np.ndarray] = None
    text: Optional[str] = None

class VectorDatabase:
    """
    Advanced vector database integration with multiple backends
    Supports FAISS for high-performance local search and ChromaDB for persistence
    """

    def __init__(self,
                 config_path: str = "production_config.json",
                 model_name: str = "all-MiniLM-L6-v2",
                 index_type: IndexType = IndexType.HNSW,
                 db_type: VectorDBType = VectorDBType.HYBRID):

        self.config = self._load_config(config_path)
        self.model_name = model_name
        self.index_type = index_type
        self.db_type = db_type

        # Initialize embedding model
        logger.info(f"Loading embedding model: {model_name}")
        self.embedding_model = SentenceTransformer(model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()

        # Initialize vector databases
        self.faiss_index = None
        self.chroma_client = None
        self.chroma_collection = None
        self.id_to_index = {}  # Map from string ID to FAISS index
        self.index_to_metadata = {}  # Map from FAISS index to metadata

        # Performance metrics
        self.metrics = {
            "total_embeddings": 0,
            "search_count": 0,
            "avg_search_time_ms": 0,
            "cache_hits": 0,
            "cache_misses": 0
        }

        # Initialize databases
        self._initialize_databases()

        logger.info(f"Vector database initialized: {db_type.value}, Index: {index_type.value}")

    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load config: {e}, using defaults")
            return self._get_default_config()

    def _get_default_config(self) -> Dict:
        """Get default configuration"""
        return {
            "vector_db": {
                "faiss_index_path": "faiss_index.bin",
                "chroma_persist_dir": "./chroma_db",
                "batch_size": 100,
                "similarity_threshold": 0.85,
                "max_results": 10
            },
            "performance": {
                "enable_gpu": False,
                "cache_embeddings": True,
                "parallel_workers": 4
            }
        }

    def _initialize_databases(self):
        """Initialize vector database backends"""
        if self.db_type in [VectorDBType.FAISS, VectorDBType.HYBRID]:
            self._initialize_faiss()

        if self.db_type in [VectorDBType.CHROMA, VectorDBType.HYBRID]:
            self._initialize_chroma()

    def _initialize_faiss(self):
        """Initialize FAISS index based on selected type"""
        if self.index_type == IndexType.FLAT:
            # Exact search, best quality
            self.faiss_index = faiss.IndexFlatL2(self.embedding_dim)

        elif self.index_type == IndexType.IVF:
            # Inverted file index for faster search
            quantizer = faiss.IndexFlatL2(self.embedding_dim)
            self.faiss_index = faiss.IndexIVFFlat(quantizer, self.embedding_dim, 100)
            # Need to train with initial data

        elif self.index_type == IndexType.HNSW:
            # Hierarchical Navigable Small World - best for production
            self.faiss_index = faiss.IndexHNSWFlat(self.embedding_dim, 32)
            # M=32 is the number of connections per layer

        elif self.index_type == IndexType.LSH:
            # Locality Sensitive Hashing for memory efficiency
            self.faiss_index = faiss.IndexLSH(self.embedding_dim, self.embedding_dim * 2)

        # Try to load existing index
        index_path = self.config.get("vector_db", {}).get("faiss_index_path", "faiss_index.bin")
        if os.path.exists(index_path):
            try:
                self.faiss_index = faiss.read_index(index_path)
                logger.info(f"Loaded existing FAISS index from {index_path}")
            except Exception as e:
                logger.warning(f"Failed to load FAISS index: {e}")

    def _initialize_chroma(self):
        """Initialize ChromaDB for persistent vector storage"""
        persist_dir = self.config.get("vector_db", {}).get("chroma_persist_dir", "./chroma_db")

        # Create ChromaDB client with persistence
        self.chroma_client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Get or create collection
        collection_name = "memory_vectors"
        try:
            self.chroma_collection = self.chroma_client.get_collection(collection_name)
            logger.info(f"Using existing ChromaDB collection: {collection_name}")
        except:
            self.chroma_collection = self.chroma_client.create_collection(
                name=collection_name,
                metadata={"hnsw:space": "l2"}  # L2 distance metric
            )
            logger.info(f"Created new ChromaDB collection: {collection_name}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def add_embeddings(self,
                            texts: List[str],
                            ids: List[str],
                            metadata: List[Dict[str, Any]] = None) -> bool:
        """
        Add text embeddings to the vector database
        Implements retry logic for production reliability
        """
        try:
            # Generate embeddings
            embeddings = await self._generate_embeddings(texts)

            if metadata is None:
                metadata = [{} for _ in texts]

            # Add to FAISS if enabled
            if self.faiss_index is not None:
                await self._add_to_faiss(embeddings, ids, metadata)

            # Add to ChromaDB if enabled
            if self.chroma_collection is not None:
                await self._add_to_chroma(texts, embeddings, ids, metadata)

            self.metrics["total_embeddings"] += len(texts)
            return True

        except Exception as e:
            logger.error(f"Failed to add embeddings: {e}")
            raise

    async def _generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts using the transformer model"""
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None,
            self.embedding_model.encode,
            texts,
            True  # Convert to numpy
        )
        return embeddings

    async def _add_to_faiss(self,
                           embeddings: np.ndarray,
                           ids: List[str],
                           metadata: List[Dict]):
        """Add embeddings to FAISS index"""
        # Convert to float32 for FAISS
        embeddings = embeddings.astype('float32')

        # Get current index size
        current_size = self.faiss_index.ntotal

        # Add to index
        self.faiss_index.add(embeddings)

        # Update mappings
        for i, (id_str, meta) in enumerate(zip(ids, metadata)):
            idx = current_size + i
            self.id_to_index[id_str] = idx
            self.index_to_metadata[idx] = {
                "id": id_str,
                "metadata": meta,
                "timestamp": datetime.now().isoformat()
            }

    async def _add_to_chroma(self,
                            texts: List[str],
                            embeddings: np.ndarray,
                            ids: List[str],
                            metadata: List[Dict]):
        """Add embeddings to ChromaDB"""
        # ChromaDB expects embeddings as list of lists
        embeddings_list = embeddings.tolist()

        # Add timestamp to metadata
        for meta in metadata:
            meta["timestamp"] = datetime.now().isoformat()

        # Add to collection
        self.chroma_collection.add(
            embeddings=embeddings_list,
            documents=texts,
            metadatas=metadata,
            ids=ids
        )

    async def search(self,
                    query: str,
                    k: int = 10,
                    threshold: float = None,
                    filter_metadata: Dict[str, Any] = None) -> List[VectorSearchResult]:
        """
        Search for similar vectors using semantic similarity
        Returns top k results above similarity threshold
        """
        start_time = asyncio.get_event_loop().time()

        try:
            # Generate query embedding
            query_embedding = await self._generate_embeddings([query])
            query_embedding = query_embedding[0]

            results = []

            # Search in FAISS if available
            if self.faiss_index is not None:
                faiss_results = await self._search_faiss(query_embedding, k * 2)  # Get more for filtering
                results.extend(faiss_results)

            # Search in ChromaDB if available
            if self.chroma_collection is not None:
                chroma_results = await self._search_chroma(query, query_embedding, k * 2, filter_metadata)
                results.extend(chroma_results)

            # Deduplicate by ID (keep highest score)
            unique_results = {}
            for result in results:
                if result.id not in unique_results or result.score > unique_results[result.id].score:
                    unique_results[result.id] = result

            # Sort by score and apply threshold
            results = sorted(unique_results.values(), key=lambda x: x.score, reverse=True)

            if threshold is None:
                threshold = self.config.get("vector_db", {}).get("similarity_threshold", 0.85)

            results = [r for r in results if r.score >= threshold][:k]

            # Update metrics
            elapsed_ms = (asyncio.get_event_loop().time() - start_time) * 1000
            self.metrics["search_count"] += 1
            self.metrics["avg_search_time_ms"] = (
                (self.metrics["avg_search_time_ms"] * (self.metrics["search_count"] - 1) + elapsed_ms) /
                self.metrics["search_count"]
            )

            logger.info(f"Vector search completed in {elapsed_ms:.2f}ms, found {len(results)} results")
            return results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    async def _search_faiss(self, query_embedding: np.ndarray, k: int) -> List[VectorSearchResult]:
        """Search in FAISS index"""
        if self.faiss_index.ntotal == 0:
            return []

        # Ensure correct shape and type
        query_embedding = query_embedding.reshape(1, -1).astype('float32')

        # Search
        distances, indices = self.faiss_index.search(query_embedding, min(k, self.faiss_index.ntotal))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for empty results
                continue

            # Convert L2 distance to similarity score (0-1)
            # Using exponential decay: similarity = exp(-distance)
            similarity = float(np.exp(-dist))

            if idx in self.index_to_metadata:
                meta = self.index_to_metadata[idx]
                results.append(VectorSearchResult(
                    id=meta["id"],
                    score=similarity,
                    metadata=meta["metadata"]
                ))

        return results

    async def _search_chroma(self,
                           query_text: str,
                           query_embedding: np.ndarray,
                           k: int,
                           filter_metadata: Dict[str, Any] = None) -> List[VectorSearchResult]:
        """Search in ChromaDB"""
        try:
            # Prepare query
            query_params = {
                "query_embeddings": [query_embedding.tolist()],
                "n_results": k,
                "include": ["metadatas", "documents", "distances"]
            }

            # Add metadata filter if provided
            if filter_metadata:
                query_params["where"] = filter_metadata

            # Execute search
            results = self.chroma_collection.query(**query_params)

            search_results = []
            if results["ids"][0]:  # Check if we have results
                for i in range(len(results["ids"][0])):
                    # Convert distance to similarity (ChromaDB returns L2 distance)
                    similarity = float(np.exp(-results["distances"][0][i]))

                    search_results.append(VectorSearchResult(
                        id=results["ids"][0][i],
                        score=similarity,
                        metadata=results["metadatas"][0][i] if results["metadatas"] else {},
                        text=results["documents"][0][i] if results["documents"] else None
                    ))

            return search_results

        except Exception as e:
            logger.error(f"ChromaDB search failed: {e}")
            return []

    async def hybrid_search(self,
                          query: str,
                          keyword_matches: List[str] = None,
                          k: int = 10,
                          alpha: float = 0.7) -> List[VectorSearchResult]:
        """
        Hybrid search combining vector similarity and keyword matching
        Alpha controls the weight: 1.0 = pure vector, 0.0 = pure keyword
        """
        # Get vector search results
        vector_results = await self.search(query, k * 2)

        if not keyword_matches:
            return vector_results[:k]

        # Boost scores for results with keyword matches
        for result in vector_results:
            keyword_score = 0
            if result.text:
                text_lower = result.text.lower()
                for keyword in keyword_matches:
                    if keyword.lower() in text_lower:
                        keyword_score += 1

                if keyword_matches:
                    keyword_score /= len(keyword_matches)

            # Combine scores
            result.score = alpha * result.score + (1 - alpha) * keyword_score

        # Re-sort by combined score
        vector_results.sort(key=lambda x: x.score, reverse=True)
        return vector_results[:k]

    async def update_embedding(self, id: str, text: str, metadata: Dict[str, Any] = None) -> bool:
        """Update an existing embedding"""
        try:
            # For ChromaDB, we can update directly
            if self.chroma_collection:
                embedding = await self._generate_embeddings([text])
                self.chroma_collection.update(
                    ids=[id],
                    embeddings=[embedding[0].tolist()],
                    documents=[text],
                    metadatas=[metadata] if metadata else None
                )

            # For FAISS, we need to remove and re-add (not efficient for frequent updates)
            # This is why ChromaDB is better for frequently updated data

            return True
        except Exception as e:
            logger.error(f"Failed to update embedding: {e}")
            return False

    async def delete_embedding(self, id: str) -> bool:
        """Delete an embedding by ID"""
        try:
            # Delete from ChromaDB
            if self.chroma_collection:
                self.chroma_collection.delete(ids=[id])

            # Remove from FAISS mappings (actual removal from index is complex)
            if id in self.id_to_index:
                idx = self.id_to_index[id]
                del self.id_to_index[id]
                if idx in self.index_to_metadata:
                    del self.index_to_metadata[idx]

            return True
        except Exception as e:
            logger.error(f"Failed to delete embedding: {e}")
            return False

    def save_index(self, path: str = None):
        """Save FAISS index to disk"""
        if self.faiss_index is None:
            return

        if path is None:
            path = self.config.get("vector_db", {}).get("faiss_index_path", "faiss_index.bin")

        try:
            faiss.write_index(self.faiss_index, path)

            # Save metadata mappings
            meta_path = path.replace('.bin', '_metadata.json')
            with open(meta_path, 'w') as f:
                json.dump({
                    "id_to_index": self.id_to_index,
                    "index_to_metadata": {str(k): v for k, v in self.index_to_metadata.items()}
                }, f)

            logger.info(f"Saved FAISS index to {path}")
        except Exception as e:
            logger.error(f"Failed to save index: {e}")

    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        metrics = self.metrics.copy()

        # Add database-specific metrics
        if self.faiss_index:
            metrics["faiss_total_vectors"] = self.faiss_index.ntotal

        if self.chroma_collection:
            metrics["chroma_total_vectors"] = self.chroma_collection.count()

        return metrics

# Example usage and testing
async def main():
    """Test the vector database"""
    db = VectorDatabase(db_type=VectorDBType.HYBRID)

    # Add some test data
    texts = [
        "Python is a high-level programming language",
        "Machine learning uses statistical methods",
        "Vector databases enable semantic search",
        "React is a JavaScript framework for building UIs",
        "Database indexing improves query performance"
    ]

    ids = [f"doc_{i}" for i in range(len(texts))]
    metadata = [{"source": "test", "index": i} for i in range(len(texts))]

    await db.add_embeddings(texts, ids, metadata)

    # Test search
    results = await db.search("programming languages for web development", k=3)

    print("Search Results:")
    for result in results:
        print(f"  ID: {result.id}, Score: {result.score:.3f}")

    # Test hybrid search
    hybrid_results = await db.hybrid_search(
        "database performance optimization",
        keyword_matches=["database", "performance"],
        k=3
    )

    print("\nHybrid Search Results:")
    for result in hybrid_results:
        print(f"  ID: {result.id}, Score: {result.score:.3f}")

    print(f"\nMetrics: {db.get_metrics()}")

if __name__ == "__main__":
    asyncio.run(main())