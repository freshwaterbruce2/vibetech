#!/usr/bin/env python3
"""
Context-Aware Memory Retrieval Service
Implements smart context loading with attention mechanisms and relevance scoring
September 2025 Architecture
"""

import asyncio
import json
import sqlite3
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import re
import hashlib
from collections import defaultdict, Counter
import logging

from enhanced_memory_manager import EnhancedMemoryManager, MemoryType

class RetrievalStrategy(Enum):
    """Context retrieval strategies"""
    RELEVANCE_BASED = "relevance_based"
    TEMPORAL_PROXIMITY = "temporal_proximity"
    SEMANTIC_SIMILARITY = "semantic_similarity"
    ATTENTION_WEIGHTED = "attention_weighted"
    HYBRID_SCORING = "hybrid_scoring"

@dataclass
class ContextQuery:
    """Structured context query"""
    keywords: List[str]
    intent_category: str
    priority_level: str
    time_window_hours: int = 24
    max_results: int = 10
    include_compressed: bool = True
    strategy: RetrievalStrategy = RetrievalStrategy.HYBRID_SCORING

@dataclass
class ContextResult:
    """Retrieved context with metadata"""
    key: str
    data: Any
    relevance_score: float
    temporal_score: float
    attention_score: float
    combined_score: float
    memory_type: str
    retrieved_at: str
    metadata: Dict[str, Any]

class ContextRetrievalService:
    """Advanced context retrieval with intelligent ranking"""

    def __init__(self, memory_manager: EnhancedMemoryManager):
        self.memory_manager = memory_manager
        self.learning_conn = memory_manager.learning_conn

        # Attention and relevance models
        self.keyword_weights = defaultdict(float)
        self.pattern_frequencies = defaultdict(int)
        self.temporal_decay_factor = 0.95  # Per hour

        # Context caches
        self.query_cache = {}
        self.relevance_cache = {}

        # Setup logging
        self.logger = logging.getLogger(__name__)

        # Load learned patterns
        self._load_attention_patterns()

    def _load_attention_patterns(self):
        """Load attention patterns from learning database"""
        try:
            # Load keyword attention weights
            keyword_patterns = self.learning_conn.execute("""
                SELECT pattern_type, context_data, frequency, success_rate
                FROM context_patterns
                WHERE pattern_type = 'keyword_attention'
                ORDER BY frequency DESC, success_rate DESC
                LIMIT 1000
            """).fetchall()

            for pattern_type, context_data_str, frequency, success_rate in keyword_patterns:
                try:
                    context_data = json.loads(context_data_str)
                    keywords = context_data.get('keywords', [])

                    for keyword in keywords:
                        # Weight based on frequency and success rate
                        weight = (frequency * (success_rate or 0.5)) / 100.0
                        self.keyword_weights[keyword] = max(self.keyword_weights[keyword], weight)

                except json.JSONDecodeError:
                    continue

            # Load pattern frequencies
            pattern_data = self.learning_conn.execute("""
                SELECT pattern_type, frequency
                FROM context_patterns
                WHERE pattern_type IN ('task_completion', 'error_resolution', 'code_pattern')
                ORDER BY frequency DESC
            """).fetchall()

            for pattern_type, frequency in pattern_data:
                self.pattern_frequencies[pattern_type] = frequency

            self.logger.info(f"Loaded {len(self.keyword_weights)} keyword weights and {len(self.pattern_frequencies)} pattern frequencies")

        except Exception as e:
            self.logger.warning(f"Failed to load attention patterns: {e}")

    async def query_context(self, query: ContextQuery) -> List[ContextResult]:
        """Main context retrieval method"""
        cache_key = self._generate_cache_key(query)

        # Check cache first
        if cache_key in self.query_cache:
            cache_entry = self.query_cache[cache_key]
            if self._is_cache_valid(cache_entry):
                self.logger.debug(f"Returning cached results for query: {query.keywords[:3]}")
                return cache_entry['results']

        # Retrieve candidates
        candidates = await self._get_candidate_memories(query)

        # Score and rank candidates
        scored_results = await self._score_candidates(candidates, query)

        # Apply retrieval strategy
        final_results = self._apply_retrieval_strategy(scored_results, query)

        # Cache results
        self.query_cache[cache_key] = {
            'results': final_results,
            'timestamp': datetime.now(),
            'ttl_minutes': 30
        }

        # Update learning patterns
        await self._update_retrieval_patterns(query, final_results)

        return final_results

    async def _get_candidate_memories(self, query: ContextQuery) -> List[Dict[str, Any]]:
        """Retrieve candidate memories from database"""
        time_cutoff = datetime.now() - timedelta(hours=query.time_window_hours)

        # Base SQL query
        sql = """
            SELECT mu.key, mu.memory_type, mu.size_bytes, mu.access_count,
                   mu.last_accessed, mu.relevance_score, mu.compression_strategy,
                   mu.storage_location, mu.metadata
            FROM memory_usage mu
            WHERE mu.last_accessed >= ?
        """
        params = [time_cutoff.isoformat()]

        # Add intent category filter
        if query.intent_category and query.intent_category != 'unknown':
            sql += " AND json_extract(mu.metadata, '$.intent_category') = ?"
            params.append(query.intent_category)

        # Add priority filter for high-priority queries
        if query.priority_level == 'high':
            sql += " AND json_extract(mu.metadata, '$.priority_level') IN ('high', 'medium')"

        # Order by relevance and recency
        sql += " ORDER BY mu.relevance_score DESC, mu.last_accessed DESC LIMIT ?"
        params.append(query.max_results * 3)  # Get more candidates for better filtering

        candidates = self.learning_conn.execute(sql, params).fetchall()

        # Convert to dictionaries and load actual data
        result_candidates = []
        for candidate in candidates:
            try:
                # Load the actual memory data
                memory_data = await self.memory_manager.retrieve_memory(
                    candidate[0],  # key
                    expand_context=query.include_compressed
                )

                if memory_data and memory_data.get('data'):
                    candidate_dict = {
                        'key': candidate[0],
                        'memory_type': candidate[1],
                        'size_bytes': candidate[2],
                        'access_count': candidate[3],
                        'last_accessed': candidate[4],
                        'relevance_score': candidate[5] or 0.5,
                        'compression_strategy': candidate[6],
                        'storage_location': candidate[7],
                        'metadata': json.loads(candidate[8]) if candidate[8] else {},
                        'data': memory_data['data']
                    }
                    result_candidates.append(candidate_dict)

            except Exception as e:
                self.logger.warning(f"Failed to load candidate {candidate[0]}: {e}")
                continue

        return result_candidates

    async def _score_candidates(self, candidates: List[Dict], query: ContextQuery) -> List[ContextResult]:
        """Score candidates based on multiple factors"""
        scored_results = []

        for candidate in candidates:
            # Calculate individual scores
            relevance_score = self._calculate_relevance_score(candidate, query)
            temporal_score = self._calculate_temporal_score(candidate)
            attention_score = self._calculate_attention_score(candidate, query)

            # Calculate combined score based on strategy
            combined_score = self._calculate_combined_score(
                relevance_score, temporal_score, attention_score, query.strategy
            )

            # Create result object
            result = ContextResult(
                key=candidate['key'],
                data=candidate['data'],
                relevance_score=relevance_score,
                temporal_score=temporal_score,
                attention_score=attention_score,
                combined_score=combined_score,
                memory_type=candidate['memory_type'],
                retrieved_at=datetime.now().isoformat(),
                metadata=candidate['metadata']
            )

            scored_results.append(result)

        return scored_results

    def _calculate_relevance_score(self, candidate: Dict, query: ContextQuery) -> float:
        """Calculate relevance score based on keyword matching and context"""
        score = 0.0

        # Convert candidate data to searchable text
        searchable_text = self._extract_searchable_text(candidate['data'])
        searchable_text_lower = searchable_text.lower()

        # Keyword matching with weights
        keyword_matches = 0
        weighted_keyword_score = 0.0

        for keyword in query.keywords:
            keyword_lower = keyword.lower()

            # Exact matches get higher score
            if keyword_lower in searchable_text_lower:
                keyword_matches += 1
                keyword_weight = self.keyword_weights.get(keyword_lower, 1.0)
                weighted_keyword_score += keyword_weight

                # Bonus for multiple occurrences
                occurrences = searchable_text_lower.count(keyword_lower)
                weighted_keyword_score += (occurrences - 1) * 0.1 * keyword_weight

        # Base relevance from keyword matching
        if query.keywords:
            keyword_ratio = keyword_matches / len(query.keywords)
            score += keyword_ratio * 0.4  # 40% weight for keyword matching

            # Add weighted keyword score
            avg_keyword_weight = weighted_keyword_score / len(query.keywords) if query.keywords else 0
            score += min(avg_keyword_weight, 0.3)  # Max 30% from weighted keywords

        # Intent category matching
        candidate_intent = candidate['metadata'].get('intent_category', '')
        if candidate_intent == query.intent_category:
            score += 0.2  # 20% bonus for matching intent

        # File/code reference matching
        if query.intent_category in ['development', 'debugging']:
            if self._has_code_references(candidate['data']):
                score += 0.1  # 10% bonus for code-related content

        return min(score, 1.0)  # Cap at 1.0

    def _calculate_temporal_score(self, candidate: Dict) -> float:
        """Calculate temporal relevance score"""
        try:
            last_accessed = datetime.fromisoformat(candidate['last_accessed'])
            hours_ago = (datetime.now() - last_accessed).total_seconds() / 3600

            # Exponential decay
            temporal_score = self.temporal_decay_factor ** hours_ago

            # Bonus for recently accessed memories
            if hours_ago < 1:
                temporal_score += 0.1
            elif hours_ago < 6:
                temporal_score += 0.05

            return min(temporal_score, 1.0)

        except Exception:
            return 0.1  # Default low score for unparseable dates

    def _calculate_attention_score(self, candidate: Dict, query: ContextQuery) -> float:
        """Calculate attention-based score"""
        score = 0.0

        # Access frequency contributes to attention
        access_count = candidate.get('access_count', 1)
        access_score = min(np.log(access_count) / 10.0, 0.3)  # Max 30% from access frequency
        score += access_score

        # Memory type importance
        memory_type = candidate.get('memory_type', '')
        type_weights = {
            'short_term': 0.3,
            'long_term': 0.2,
            'episodic': 0.25,
            'semantic': 0.15,
            'procedural': 0.2
        }
        score += type_weights.get(memory_type, 0.1)

        # Size consideration (larger contexts might be more comprehensive)
        size_bytes = candidate.get('size_bytes', 0)
        if size_bytes > 1000:  # Non-trivial size
            size_score = min(np.log(size_bytes) / 50.0, 0.2)  # Max 20% from size
            score += size_score

        # Priority level from metadata
        priority = candidate['metadata'].get('priority_level', 'normal')
        priority_weights = {'high': 0.2, 'medium': 0.1, 'normal': 0.0}
        score += priority_weights.get(priority, 0.0)

        return min(score, 1.0)

    def _calculate_combined_score(self, relevance: float, temporal: float,
                                attention: float, strategy: RetrievalStrategy) -> float:
        """Combine individual scores based on strategy"""
        if strategy == RetrievalStrategy.RELEVANCE_BASED:
            return relevance * 0.7 + temporal * 0.2 + attention * 0.1

        elif strategy == RetrievalStrategy.TEMPORAL_PROXIMITY:
            return temporal * 0.6 + relevance * 0.3 + attention * 0.1

        elif strategy == RetrievalStrategy.ATTENTION_WEIGHTED:
            return attention * 0.5 + relevance * 0.3 + temporal * 0.2

        elif strategy == RetrievalStrategy.SEMANTIC_SIMILARITY:
            return relevance * 0.8 + attention * 0.15 + temporal * 0.05

        else:  # HYBRID_SCORING (default)
            return relevance * 0.4 + temporal * 0.3 + attention * 0.3

    def _apply_retrieval_strategy(self, scored_results: List[ContextResult],
                                query: ContextQuery) -> List[ContextResult]:
        """Apply final retrieval strategy and return top results"""
        # Sort by combined score
        sorted_results = sorted(scored_results, key=lambda x: x.combined_score, reverse=True)

        # Apply diversity filtering to avoid too many similar results
        diverse_results = self._apply_diversity_filter(sorted_results, query.max_results)

        # Limit to requested number of results
        final_results = diverse_results[:query.max_results]

        return final_results

    def _apply_diversity_filter(self, results: List[ContextResult], max_results: int) -> List[ContextResult]:
        """Filter results to ensure diversity"""
        if len(results) <= max_results:
            return results

        diverse_results = []
        seen_intents = set()
        seen_keys = set()

        # First pass: take the best result from each intent category
        for result in results:
            intent = result.metadata.get('intent_category', 'unknown')
            if intent not in seen_intents and result.key not in seen_keys:
                diverse_results.append(result)
                seen_intents.add(intent)
                seen_keys.add(result.key)

                if len(diverse_results) >= max_results:
                    break

        # Second pass: fill remaining slots with highest scoring results
        for result in results:
            if len(diverse_results) >= max_results:
                break

            if result.key not in seen_keys:
                diverse_results.append(result)
                seen_keys.add(result.key)

        return diverse_results

    def _extract_searchable_text(self, data: Any) -> str:
        """Extract searchable text from memory data"""
        if isinstance(data, str):
            return data

        if isinstance(data, dict):
            searchable_parts = []

            # Extract key fields
            for key in ['task', 'goal', 'method', 'result', 'error', 'description',
                       'prompt', 'content', 'message', 'summary']:
                if key in data:
                    searchable_parts.append(str(data[key]))

            # Extract file paths and names
            for key in ['file_path', 'files_mentioned', 'key_files']:
                if key in data:
                    if isinstance(data[key], list):
                        searchable_parts.extend([str(item) for item in data[key]])
                    else:
                        searchable_parts.append(str(data[key]))

            return ' '.join(searchable_parts)

        return str(data)

    def _has_code_references(self, data: Any) -> bool:
        """Check if data contains code-related references"""
        searchable_text = self._extract_searchable_text(data).lower()

        code_indicators = [
            'function', 'class', 'method', 'variable', 'api', 'endpoint',
            'database', 'query', 'table', 'schema', 'import', 'export',
            'component', 'service', 'module', '.js', '.py', '.ts', '.json',
            'npm', 'pip', 'git', 'repository', 'commit', 'branch'
        ]

        return any(indicator in searchable_text for indicator in code_indicators)

    def _generate_cache_key(self, query: ContextQuery) -> str:
        """Generate cache key for query"""
        key_data = {
            'keywords': sorted(query.keywords),
            'intent_category': query.intent_category,
            'priority_level': query.priority_level,
            'time_window_hours': query.time_window_hours,
            'max_results': query.max_results,
            'strategy': query.strategy.value
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        age_minutes = (datetime.now() - cache_entry['timestamp']).total_seconds() / 60
        return age_minutes < cache_entry.get('ttl_minutes', 30)

    async def _update_retrieval_patterns(self, query: ContextQuery, results: List[ContextResult]):
        """Update learning patterns based on retrieval results"""
        try:
            # Track keyword effectiveness
            if results and query.keywords:
                avg_relevance = np.mean([r.relevance_score for r in results])

                pattern_data = {
                    'keywords': query.keywords,
                    'avg_relevance': avg_relevance,
                    'result_count': len(results),
                    'strategy': query.strategy.value
                }

                pattern_hash = hashlib.md5(json.dumps(pattern_data, sort_keys=True).encode()).hexdigest()

                self.learning_conn.execute("""
                    INSERT OR REPLACE INTO context_patterns
                    (pattern_hash, pattern_type, frequency, success_rate, context_data, last_used)
                    VALUES (?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
                """, (pattern_hash, 'keyword_attention', avg_relevance, json.dumps(pattern_data)))

                self.learning_conn.commit()

        except Exception as e:
            self.logger.warning(f"Failed to update retrieval patterns: {e}")

    async def get_contextual_suggestions(self, current_prompt: str,
                                       intent_category: str = None) -> List[str]:
        """Get contextual suggestions based on current prompt"""
        # Analyze current prompt for keywords
        keywords = self._extract_keywords(current_prompt)

        # Create query for similar contexts
        query = ContextQuery(
            keywords=keywords,
            intent_category=intent_category or 'unknown',
            priority_level='normal',
            time_window_hours=168,  # One week
            max_results=5,
            strategy=RetrievalStrategy.SEMANTIC_SIMILARITY
        )

        # Retrieve similar contexts
        results = await self.query_context(query)

        # Extract suggestions from retrieved contexts
        suggestions = []
        for result in results:
            suggestion = self._extract_suggestion(result.data, current_prompt)
            if suggestion:
                suggestions.append(suggestion)

        return suggestions[:3]  # Return top 3 suggestions

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction (could be enhanced with NLP)
        words = re.findall(r'\b\w+\b', text.lower())

        # Filter out common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
                     'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
                     'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
                     'will', 'would', 'could', 'should', 'can', 'may', 'might'}

        keywords = [word for word in words if word not in stop_words and len(word) > 2]

        # Return most frequent keywords
        word_counts = Counter(keywords)
        return [word for word, count in word_counts.most_common(10)]

    def _extract_suggestion(self, context_data: Any, current_prompt: str) -> Optional[str]:
        """Extract actionable suggestion from context data"""
        if isinstance(context_data, dict):
            # Look for successful approaches
            if context_data.get('result') and 'success' in str(context_data['result']).lower():
                approach = context_data.get('approach') or context_data.get('method')
                if approach:
                    return f"Try this approach: {approach}"

            # Look for error resolutions
            if context_data.get('error') and context_data.get('solution'):
                return f"Previous solution for similar error: {context_data['solution']}"

            # Look for relevant tools or commands
            tools = context_data.get('tools_used') or context_data.get('tools_mentioned')
            if tools:
                if isinstance(tools, list):
                    return f"Consider using these tools: {', '.join(tools[:3])}"
                else:
                    return f"Consider using: {tools}"

        return None

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get retrieval service performance metrics"""
        return {
            'cache_size': len(self.query_cache),
            'keyword_weights_loaded': len(self.keyword_weights),
            'pattern_frequencies_loaded': len(self.pattern_frequencies),
            'cache_hit_rate': self._calculate_cache_hit_rate(),
            'avg_results_per_query': self._calculate_avg_results(),
            'temporal_decay_factor': self.temporal_decay_factor
        }

    def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate (simplified)"""
        # This would need actual hit/miss tracking in production
        return 0.75  # Placeholder

    def _calculate_avg_results(self) -> float:
        """Calculate average results per query"""
        if not self.query_cache:
            return 0.0

        total_results = sum(len(entry['results']) for entry in self.query_cache.values())
        return total_results / len(self.query_cache)


# CLI Interface for testing
async def main():
    """Test the context retrieval service"""
    memory_manager = EnhancedMemoryManager()
    retrieval_service = ContextRetrievalService(memory_manager)

    # Test query
    query = ContextQuery(
        keywords=['implement', 'memory', 'system'],
        intent_category='development',
        priority_level='high',
        time_window_hours=48,
        max_results=5
    )

    print("Testing Context Retrieval Service...")
    results = await retrieval_service.query_context(query)

    print(f"\nFound {len(results)} relevant contexts:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. Key: {result.key}")
        print(f"   Relevance: {result.relevance_score:.3f}")
        print(f"   Temporal: {result.temporal_score:.3f}")
        print(f"   Attention: {result.attention_score:.3f}")
        print(f"   Combined: {result.combined_score:.3f}")
        print(f"   Type: {result.memory_type}")

    # Test suggestions
    suggestions = await retrieval_service.get_contextual_suggestions(
        "How do I implement a memory system?",
        "development"
    )

    print(f"\nContextual suggestions:")
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. {suggestion}")

    # Performance metrics
    metrics = retrieval_service.get_performance_metrics()
    print(f"\nPerformance metrics: {json.dumps(metrics, indent=2)}")


if __name__ == "__main__":
    asyncio.run(main())