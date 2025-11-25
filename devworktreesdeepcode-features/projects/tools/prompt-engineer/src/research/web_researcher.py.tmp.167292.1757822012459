#!/usr/bin/env python3
"""
Web Research & Integration System

Advanced web research capabilities for finding similar projects, solutions,
documentation, and competitor analysis. Integrates with multiple search engines
and knowledge bases to provide comprehensive research for prompt engineering.
"""

import re
import json
import time
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse
from pathlib import Path

@dataclass
class ResearchResult:
    """Result from web research."""
    title: str
    url: str
    description: str
    source: str  # 'github', 'stackoverflow', 'documentation', 'blog', etc.
    relevance_score: float  # 0.0 to 1.0
    content_type: str  # 'code', 'tutorial', 'documentation', 'discussion', etc.
    technology_stack: List[str] = field(default_factory=list)
    key_concepts: List[str] = field(default_factory=list)
    last_updated: Optional[str] = None
    stars: Optional[int] = None  # For GitHub repos
    language: Optional[str] = None
    license: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CompetitorAnalysis:
    """Analysis of competitor tools and solutions."""
    tool_name: str
    category: str  # 'prompt_engineering', 'code_analysis', 'context_collection', etc.
    description: str
    key_features: List[str]
    technology_stack: List[str]
    pricing_model: str  # 'free', 'freemium', 'paid', 'open_source'
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    documentation_url: Optional[str] = None
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    market_position: str = ""  # 'leader', 'challenger', 'niche', 'emerging'
    last_updated: Optional[str] = None
    community_size: Optional[int] = None
    github_stats: Dict[str, Any] = field(default_factory=dict)

class WebResearcher:
    """
    Advanced web research system for finding solutions, competitors, and documentation.
    """
    
    def __init__(self):
        self.search_engines = self._initialize_search_engines()
        self.knowledge_bases = self._initialize_knowledge_bases()
        self.research_cache: Dict[str, List[ResearchResult]] = {}
        self.rate_limits = self._initialize_rate_limits()
        self.last_requests = {}
    
    def research_similar_projects(self, project_description: str, tech_stack: List[str], 
                                  max_results: int = 20) -> List[ResearchResult]:
        """Research similar projects and solutions."""
        results = []
        
        # Generate search queries
        queries = self._generate_project_search_queries(project_description, tech_stack)
        
        for query in queries[:5]:  # Limit to top 5 queries
            # GitHub search
            github_results = self._search_github_repositories(query, tech_stack, max_results=5)
            results.extend(github_results)
            
            # Stack Overflow search
            so_results = self._search_stackoverflow(query, tech_stack, max_results=3)
            results.extend(so_results)
            
            # Documentation search
            doc_results = self._search_documentation_sites(query, tech_stack, max_results=3)
            results.extend(doc_results)
            
            # General web search
            web_results = self._search_web(query, max_results=3)
            results.extend(web_results)
        
        # Deduplicate and rank results
        unique_results = self._deduplicate_results(results)
        ranked_results = self._rank_results(unique_results, project_description, tech_stack)
        
        return ranked_results[:max_results]
    
    def analyze_competitors(self, domain: str = "prompt engineering") -> List[CompetitorAnalysis]:
        """Analyze competitors in a specific domain."""
        competitors = []
        
        if domain == "prompt engineering":
            # Known prompt engineering tools
            known_tools = [
                "langchain", "llamaindex", "guidance", "promptfoo", "dspy",
                "semantic-kernel", "haystack", "langfuse", "weights-biases",
                "openai-cookbook", "anthropic-cookbook"
            ]
            
            for tool in known_tools:
                try:
                    analysis = self._analyze_tool(tool)
                    if analysis:
                        competitors.append(analysis)
                        time.sleep(1)  # Rate limiting
                except Exception as e:
                    print(f"Error analyzing {tool}: {e}")
                    continue
        
        # Search for additional tools
        search_queries = [
            f"{domain} tools",
            f"{domain} frameworks",
            f"{domain} libraries",
            f"best {domain} software"
        ]
        
        for query in search_queries:
            web_results = self._search_web(query, max_results=10)
            for result in web_results:
                if self._looks_like_tool_or_library(result):
                    try:
                        tool_name = self._extract_tool_name(result)
                        if tool_name and not any(c.tool_name.lower() == tool_name.lower() for c in competitors):
                            analysis = self._analyze_tool_from_result(result)
                            if analysis:
                                competitors.append(analysis)
                    except Exception:
                        continue
        
        return competitors
    
    def find_solutions_for_problem(self, problem_description: str, context: Dict[str, Any]) -> List[ResearchResult]:
        """Find solutions for a specific problem."""
        tech_stack = context.get('tech_stack', [])
        project_type = context.get('project_type', '')
        
        # Generate problem-specific queries
        queries = self._generate_problem_search_queries(problem_description, tech_stack, project_type)
        
        results = []
        
        for query in queries[:3]:
            # Stack Overflow (best for specific problems)
            so_results = self._search_stackoverflow(query, tech_stack, max_results=5)
            results.extend(so_results)
            
            # GitHub issues and discussions
            github_results = self._search_github_issues(query, max_results=3)
            results.extend(github_results)
            
            # Dev.to and Medium articles
            article_results = self._search_dev_articles(query, max_results=3)
            results.extend(article_results)
            
            # Documentation sites
            doc_results = self._search_documentation_sites(query, tech_stack, max_results=2)
            results.extend(doc_results)
        
        # Rank by relevance to problem
        ranked_results = self._rank_problem_solutions(results, problem_description, context)
        
        return ranked_results[:15]
    
    def research_best_practices(self, topic: str, tech_stack: List[str]) -> List[ResearchResult]:
        """Research best practices for a specific topic."""
        queries = [
            f"{topic} best practices {' '.join(tech_stack[:2])}",
            f"how to {topic} properly",
            f"{topic} patterns and practices",
            f"{topic} industry standards",
            f"modern {topic} approaches"
        ]
        
        results = []
        
        for query in queries:
            # Documentation sites (authoritative sources)
            doc_results = self._search_documentation_sites(query, tech_stack, max_results=3)
            results.extend(doc_results)
            
            # Developer blogs and articles
            article_results = self._search_dev_articles(query, max_results=2)
            results.extend(article_results)
            
            # GitHub awesome lists
            awesome_results = self._search_github_awesome_lists(topic, max_results=2)
            results.extend(awesome_results)
            
            # Conference talks and presentations
            talk_results = self._search_conference_content(query, max_results=1)
            results.extend(talk_results)
        
        # Filter for high-quality, authoritative sources
        quality_results = self._filter_quality_sources(results)
        
        return quality_results[:10]
    
    def get_technology_trends(self, technology: str) -> Dict[str, Any]:
        """Get current trends and developments for a technology."""
        trends = {
            'technology': technology,
            'popularity_trend': 'stable',  # 'growing', 'stable', 'declining'
            'recent_developments': [],
            'popular_libraries': [],
            'community_sentiment': 'positive',  # 'positive', 'neutral', 'negative'
            'job_market': {},
            'learning_resources': [],
            'last_updated': datetime.now().isoformat()
        }
        
        # Search for recent developments
        recent_query = f"{technology} 2024 2025 new features updates"
        recent_results = self._search_web(recent_query, max_results=5)
        trends['recent_developments'] = [
            {'title': r.title, 'url': r.url, 'description': r.description}
            for r in recent_results[:3]
        ]
        
        # Popular libraries/frameworks
        lib_query = f"best {technology} libraries frameworks 2024"
        lib_results = self._search_github_repositories(lib_query, [technology], max_results=5)
        trends['popular_libraries'] = [
            {'name': self._extract_repo_name(r.url), 'stars': r.stars, 'description': r.description}
            for r in lib_results if r.stars
        ]
        
        # Learning resources
        learn_query = f"learn {technology} tutorial guide 2024"
        learn_results = self._search_web(learn_query, max_results=5)
        trends['learning_resources'] = [
            {'title': r.title, 'url': r.url, 'type': r.content_type}
            for r in learn_results[:3]
        ]
        
        return trends
    
    def _initialize_search_engines(self) -> Dict[str, Dict[str, Any]]:
        """Initialize search engine configurations."""
        return {
            'github': {
                'base_url': 'https://api.github.com/search',
                'rate_limit': 10,  # requests per minute
                'requires_auth': False
            },
            'stackoverflow': {
                'base_url': 'https://api.stackexchange.com/2.3/search',
                'rate_limit': 300,  # requests per day
                'requires_auth': False
            },
            'web': {
                'enabled': True,  # Would integrate with search APIs in production
                'rate_limit': 100,  # requests per day
                'requires_auth': True
            }
        }
    
    def _initialize_knowledge_bases(self) -> Dict[str, List[str]]:
        """Initialize knowledge base URLs."""
        return {
            'documentation': [
                'docs.python.org', 'developer.mozilla.org', 'docs.microsoft.com',
                'cloud.google.com/docs', 'docs.aws.amazon.com', 'kubernetes.io/docs',
                'reactjs.org/docs', 'vuejs.org/guide', 'angular.io/docs',
                'nodejs.org/docs', 'django-doc.readthedocs.io', 'flask.palletsprojects.com'
            ],
            'dev_blogs': [
                'dev.to', 'medium.com', 'hashnode.com', 'blog.logrocket.com',
                'css-tricks.com', 'smashingmagazine.com', 'a11yproject.com'
            ],
            'forums': [
                'stackoverflow.com', 'reddit.com/r/programming', 'news.ycombinator.com',
                'discourse.org', 'reddit.com/r/webdev', 'reddit.com/r/python'
            ],
            'repositories': [
                'github.com', 'gitlab.com', 'bitbucket.org'
            ]
        }
    
    def _initialize_rate_limits(self) -> Dict[str, Dict[str, Any]]:
        """Initialize rate limiting configurations."""
        return {
            'github': {'requests_per_minute': 10, 'requests_per_hour': 60},
            'stackoverflow': {'requests_per_minute': 30, 'requests_per_hour': 300},
            'web': {'requests_per_minute': 10, 'requests_per_hour': 100}
        }
    
    def _generate_project_search_queries(self, description: str, tech_stack: List[str]) -> List[str]:
        """Generate search queries for finding similar projects."""
        queries = []
        
        # Extract key concepts from description
        key_terms = self._extract_key_terms(description)
        
        # Basic queries
        queries.append(f"{' '.join(key_terms[:3])} {' '.join(tech_stack[:2])}")
        
        # Technology-specific queries
        for tech in tech_stack[:2]:
            queries.append(f"{tech} {' '.join(key_terms[:2])}")
        
        # GitHub-specific queries
        queries.append(f"site:github.com {' '.join(key_terms[:2])}")
        
        # Open source alternatives
        queries.append(f"open source {' '.join(key_terms[:2])}")
        
        return queries
    
    def _generate_problem_search_queries(self, problem: str, tech_stack: List[str], project_type: str) -> List[str]:
        """Generate search queries for finding problem solutions."""
        queries = []
        
        # Direct problem query
        queries.append(f"{problem} {' '.join(tech_stack[:2])}")
        
        # Stack Overflow specific
        queries.append(f"site:stackoverflow.com {problem}")
        
        # How-to queries
        queries.append(f"how to solve {problem}")
        
        # Error/issue specific
        if any(word in problem.lower() for word in ['error', 'issue', 'problem', 'bug']):
            queries.append(f"fix {problem} {tech_stack[0] if tech_stack else ''}")
        
        return queries
    
    def _search_github_repositories(self, query: str, tech_stack: List[str], max_results: int = 10) -> List[ResearchResult]:
        """Search GitHub repositories (simulated - would use GitHub API in production)."""
        results = []
        
        # Simulated GitHub search results
        # In production, this would use the GitHub API
        simulated_repos = [
            {
                'name': 'example-project',
                'full_name': 'user/example-project',
                'description': f'A project related to {query}',
                'url': 'https://github.com/user/example-project',
                'stars': 1250,
                'language': tech_stack[0] if tech_stack else 'Python',
                'updated_at': '2024-01-15T10:30:00Z'
            },
            {
                'name': 'awesome-tools',
                'full_name': 'community/awesome-tools',
                'description': f'Awesome tools for {query}',
                'url': 'https://github.com/community/awesome-tools',
                'stars': 850,
                'language': 'JavaScript',
                'updated_at': '2024-02-10T15:45:00Z'
            }
        ]
        
        for repo in simulated_repos[:max_results]:
            result = ResearchResult(
                title=repo['name'],
                url=repo['url'],
                description=repo['description'],
                source='github',
                relevance_score=0.8,
                content_type='code',
                technology_stack=[repo['language']] if repo['language'] else [],
                stars=repo['stars'],
                language=repo['language'],
                last_updated=repo['updated_at']
            )
            results.append(result)
        
        return results
    
    def _search_stackoverflow(self, query: str, tech_stack: List[str], max_results: int = 10) -> List[ResearchResult]:
        """Search Stack Overflow (simulated)."""
        results = []
        
        # Simulated Stack Overflow results
        simulated_questions = [
            {
                'title': f'How to implement {query}',
                'url': f'https://stackoverflow.com/questions/123456/how-to-implement-{query.replace(" ", "-")}',
                'score': 45,
                'answer_count': 3,
                'tags': tech_stack[:3] if tech_stack else ['python'],
                'creation_date': '2024-01-20T08:15:00Z'
            }
        ]
        
        for q in simulated_questions[:max_results]:
            result = ResearchResult(
                title=q['title'],
                url=q['url'],
                description=f"Stack Overflow question with {q['answer_count']} answers and score of {q['score']}",
                source='stackoverflow',
                relevance_score=min(q['score'] / 50.0, 1.0),
                content_type='discussion',
                technology_stack=q['tags'],
                last_updated=q['creation_date'],
                metadata={
                    'score': q['score'],
                    'answer_count': q['answer_count']
                }
            )
            results.append(result)
        
        return results
    
    def _search_documentation_sites(self, query: str, tech_stack: List[str], max_results: int = 5) -> List[ResearchResult]:
        """Search official documentation sites."""
        results = []
        
        # Map technologies to their documentation sites
        doc_sites = {
            'python': 'docs.python.org',
            'javascript': 'developer.mozilla.org',
            'react': 'reactjs.org/docs',
            'vue': 'vuejs.org/guide',
            'angular': 'angular.io/docs',
            'nodejs': 'nodejs.org/docs',
            'django': 'docs.djangoproject.com',
            'flask': 'flask.palletsprojects.com'
        }
        
        for tech in tech_stack:
            if tech.lower() in doc_sites:
                site = doc_sites[tech.lower()]
                result = ResearchResult(
                    title=f"{tech.title()} Documentation - {query}",
                    url=f"https://{site}/search?q={query.replace(' ', '+')}",
                    description=f"Official {tech} documentation covering {query}",
                    source='documentation',
                    relevance_score=0.9,  # Documentation is highly relevant
                    content_type='documentation',
                    technology_stack=[tech],
                    metadata={'official': True, 'site': site}
                )
                results.append(result)
        
        return results[:max_results]
    
    def _search_web(self, query: str, max_results: int = 10) -> List[ResearchResult]:
        """General web search (simulated - would use search API in production)."""
        results = []
        
        # Simulated web search results
        simulated_results = [
            {
                'title': f'Complete Guide to {query}',
                'url': f'https://example-blog.com/guide-to-{query.replace(" ", "-")}',
                'description': f'A comprehensive guide covering {query} with examples and best practices',
                'source': 'blog'
            },
            {
                'title': f'{query} Tutorial for Beginners',
                'url': f'https://dev.to/tutorial-{query.replace(" ", "-")}',
                'description': f'Step-by-step tutorial for learning {query}',
                'source': 'dev_blog'
            }
        ]
        
        for item in simulated_results[:max_results]:
            result = ResearchResult(
                title=item['title'],
                url=item['url'],
                description=item['description'],
                source=item['source'],
                relevance_score=0.7,
                content_type='tutorial',
                key_concepts=self._extract_key_terms(query)[:3]
            )
            results.append(result)
        
        return results
    
    def _search_github_issues(self, query: str, max_results: int = 5) -> List[ResearchResult]:
        """Search GitHub issues for problem discussions."""
        results = []
        
        # Simulated GitHub issues
        simulated_issues = [
            {
                'title': f'Issue: {query}',
                'url': f'https://github.com/example/repo/issues/123',
                'state': 'closed',
                'comments': 8,
                'created_at': '2024-01-10T12:00:00Z'
            }
        ]
        
        for issue in simulated_issues[:max_results]:
            result = ResearchResult(
                title=issue['title'],
                url=issue['url'],
                description=f"GitHub issue discussion with {issue['comments']} comments ({issue['state']})",
                source='github',
                relevance_score=0.6,
                content_type='discussion',
                last_updated=issue['created_at'],
                metadata={
                    'state': issue['state'],
                    'comments': issue['comments']
                }
            )
            results.append(result)
        
        return results
    
    def _search_dev_articles(self, query: str, max_results: int = 5) -> List[ResearchResult]:
        """Search dev.to and similar platforms."""
        results = []
        
        # Simulated dev article results
        simulated_articles = [
            {
                'title': f'Mastering {query}',
                'url': f'https://dev.to/author/mastering-{query.replace(" ", "-")}',
                'reactions': 25,
                'comments': 5,
                'published_at': '2024-02-01T09:30:00Z'
            }
        ]
        
        for article in simulated_articles[:max_results]:
            result = ResearchResult(
                title=article['title'],
                url=article['url'],
                description=f"Developer article with {article['reactions']} reactions and {article['comments']} comments",
                source='dev_blog',
                relevance_score=0.7,
                content_type='tutorial',
                last_updated=article['published_at'],
                metadata={
                    'reactions': article['reactions'],
                    'comments': article['comments']
                }
            )
            results.append(result)
        
        return results
    
    def _search_github_awesome_lists(self, topic: str, max_results: int = 3) -> List[ResearchResult]:
        """Search GitHub awesome lists for curated resources."""
        results = []
        
        # Common awesome list patterns
        awesome_repos = [
            f'awesome-{topic.lower()}',
            f'awesome-{topic.lower()}-resources',
            f'{topic.lower()}-awesome'
        ]
        
        for repo_name in awesome_repos[:max_results]:
            result = ResearchResult(
                title=f'Awesome {topic.title()}',
                url=f'https://github.com/topics/{repo_name}',
                description=f'Curated list of awesome {topic} resources, libraries, and tools',
                source='github',
                relevance_score=0.8,
                content_type='curated_list',
                key_concepts=[topic, 'resources', 'tools'],
                metadata={'list_type': 'awesome'}
            )
            results.append(result)
        
        return results
    
    def _search_conference_content(self, query: str, max_results: int = 3) -> List[ResearchResult]:
        """Search for conference talks and presentations."""
        results = []
        
        # Simulated conference content
        simulated_talks = [
            {
                'title': f'Conference Talk: {query}',
                'url': f'https://youtube.com/watch?v=example-{query.replace(" ", "-")}',
                'conference': 'PyCon 2024',
                'speaker': 'Expert Developer',
                'duration': '25 minutes'
            }
        ]
        
        for talk in simulated_talks[:max_results]:
            result = ResearchResult(
                title=talk['title'],
                url=talk['url'],
                description=f"Conference presentation by {talk['speaker']} at {talk['conference']} ({talk['duration']})",
                source='conference',
                relevance_score=0.8,
                content_type='presentation',
                metadata={
                    'conference': talk['conference'],
                    'speaker': talk['speaker'],
                    'duration': talk['duration']
                }
            )
            results.append(result)
        
        return results
    
    def _analyze_tool(self, tool_name: str) -> Optional[CompetitorAnalysis]:
        """Analyze a specific tool or library."""
        # This would typically involve:
        # 1. GitHub API calls to get repository information
        # 2. Documentation scraping
        # 3. Package registry API calls
        # 4. Community metrics gathering
        
        # Simulated analysis for demonstration
        tool_data = {
            'langchain': {
                'category': 'prompt_engineering',
                'description': 'Framework for developing applications powered by language models',
                'features': ['LLM integrations', 'Chain composition', 'Memory management', 'Agent framework'],
                'tech_stack': ['Python', 'TypeScript'],
                'pricing': 'open_source',
                'github_url': 'https://github.com/langchain-ai/langchain',
                'strengths': ['Comprehensive', 'Active community', 'Good documentation'],
                'weaknesses': ['Complex for beginners', 'Frequent API changes'],
                'market_position': 'leader'
            },
            'llamaindex': {
                'category': 'context_collection',
                'description': 'Data framework for LLM applications',
                'features': ['Data connectors', 'Index management', 'Query engines', 'RAG pipelines'],
                'tech_stack': ['Python'],
                'pricing': 'open_source',
                'github_url': 'https://github.com/run-llama/llama_index',
                'strengths': ['Focus on data', 'Good RAG support', 'Flexible indexing'],
                'weaknesses': ['Steeper learning curve', 'Limited chain composition'],
                'market_position': 'challenger'
            }
        }
        
        if tool_name.lower() in tool_data:
            data = tool_data[tool_name.lower()]
            return CompetitorAnalysis(
                tool_name=tool_name.title(),
                category=data['category'],
                description=data['description'],
                key_features=data['features'],
                technology_stack=data['tech_stack'],
                pricing_model=data['pricing'],
                github_url=data['github_url'],
                strengths=data['strengths'],
                weaknesses=data['weaknesses'],
                market_position=data['market_position'],
                last_updated=datetime.now().isoformat(),
                github_stats={'stars': 25000, 'forks': 3500, 'issues': 150}  # Simulated
            )
        
        return None
    
    def _analyze_tool_from_result(self, result: ResearchResult) -> Optional[CompetitorAnalysis]:
        """Analyze a tool from a search result."""
        # Extract tool information from search result
        tool_name = self._extract_tool_name(result)
        
        if not tool_name:
            return None
        
        # Basic analysis from available information
        return CompetitorAnalysis(
            tool_name=tool_name,
            category='unknown',
            description=result.description,
            key_features=[],
            technology_stack=result.technology_stack,
            pricing_model='unknown',
            website_url=result.url,
            last_updated=datetime.now().isoformat()
        )
    
    def _deduplicate_results(self, results: List[ResearchResult]) -> List[ResearchResult]:
        """Remove duplicate results based on URL and title similarity."""
        unique_results = []
        seen_urls = set()
        seen_titles = set()
        
        for result in results:
            # Check URL duplicates
            if result.url in seen_urls:
                continue
            
            # Check title similarity
            title_words = set(result.title.lower().split())
            is_similar = False
            
            for seen_title in seen_titles:
                seen_words = set(seen_title.lower().split())
                similarity = len(title_words & seen_words) / len(title_words | seen_words)
                if similarity > 0.7:  # 70% similarity threshold
                    is_similar = True
                    break
            
            if not is_similar:
                unique_results.append(result)
                seen_urls.add(result.url)
                seen_titles.add(result.title)
        
        return unique_results
    
    def _rank_results(self, results: List[ResearchResult], query: str, tech_stack: List[str]) -> List[ResearchResult]:
        """Rank results by relevance."""
        for result in results:
            score = result.relevance_score
            
            # Boost score based on source quality
            source_weights = {
                'documentation': 1.2,
                'github': 1.1,
                'stackoverflow': 1.1,
                'conference': 1.1,
                'dev_blog': 1.0,
                'blog': 0.9
            }
            score *= source_weights.get(result.source, 1.0)
            
            # Boost for matching technology stack
            if result.technology_stack:
                common_tech = set([t.lower() for t in result.technology_stack]) & set([t.lower() for t in tech_stack])
                if common_tech:
                    score *= (1.0 + 0.2 * len(common_tech))
            
            # Boost for recency (for GitHub repos and articles)
            if result.last_updated:
                try:
                    updated_date = datetime.fromisoformat(result.last_updated.replace('Z', '+00:00'))
                    days_old = (datetime.now() - updated_date.replace(tzinfo=None)).days
                    if days_old < 30:
                        score *= 1.2
                    elif days_old < 90:
                        score *= 1.1
                    elif days_old > 365:
                        score *= 0.9
                except:
                    pass
            
            # Boost for GitHub stars
            if result.stars and result.stars > 100:
                score *= min(1.5, 1.0 + (result.stars / 10000))
            
            result.relevance_score = min(1.0, score)
        
        # Sort by relevance score
        return sorted(results, key=lambda r: r.relevance_score, reverse=True)
    
    def _rank_problem_solutions(self, results: List[ResearchResult], problem: str, context: Dict[str, Any]) -> List[ResearchResult]:
        """Rank results specifically for problem-solving relevance."""
        problem_keywords = set(problem.lower().split())
        
        for result in results:
            score = result.relevance_score
            
            # Higher weight for Stack Overflow for problem-solving
            if result.source == 'stackoverflow':
                score *= 1.3
            
            # Boost for exact keyword matches
            title_keywords = set(result.title.lower().split())
            desc_keywords = set(result.description.lower().split())
            
            title_matches = len(problem_keywords & title_keywords)
            desc_matches = len(problem_keywords & desc_keywords)
            
            if title_matches > 0:
                score *= (1.0 + 0.3 * title_matches)
            if desc_matches > 0:
                score *= (1.0 + 0.2 * desc_matches)
            
            # Boost for solutions with high answer/comment counts
            if result.metadata:
                if 'answer_count' in result.metadata and result.metadata['answer_count'] > 0:
                    score *= (1.0 + 0.1 * min(5, result.metadata['answer_count']))
                if 'comments' in result.metadata and result.metadata['comments'] > 5:
                    score *= 1.1
            
            result.relevance_score = min(1.0, score)
        
        return sorted(results, key=lambda r: r.relevance_score, reverse=True)
    
    def _filter_quality_sources(self, results: List[ResearchResult]) -> List[ResearchResult]:
        """Filter results to keep only high-quality sources."""
        quality_sources = {
            'documentation', 'conference', 'github'
        }
        
        quality_domains = {
            'stackoverflow.com', 'dev.to', 'medium.com', 'css-tricks.com',
            'smashingmagazine.com', 'developer.mozilla.org', 'web.dev'
        }
        
        filtered_results = []
        
        for result in results:
            # Keep results from quality sources
            if result.source in quality_sources:
                filtered_results.append(result)
                continue
            
            # Keep results from quality domains
            domain = urlparse(result.url).netloc.lower()
            if any(qd in domain for qd in quality_domains):
                filtered_results.append(result)
                continue
            
            # Keep results with high relevance scores
            if result.relevance_score >= 0.8:
                filtered_results.append(result)
        
        return filtered_results
    
    def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key terms from text."""
        # Simple keyword extraction
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Remove common stop words
        stop_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'how', 'was', 'one',
            'our', 'out', 'day', 'get', 'has', 'her', 'his', 'him', 'his', 'how', 'man', 'may', 'new',
            'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she',
            'too', 'use', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been',
            'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make',
            'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
        }
        
        keywords = [word for word in words if word not in stop_words and len(word) > 3]
        
        # Return most frequent terms
        from collections import Counter
        return [word for word, count in Counter(keywords).most_common(10)]
    
    def _looks_like_tool_or_library(self, result: ResearchResult) -> bool:
        """Check if a result looks like a tool or library."""
        indicators = [
            'library', 'framework', 'tool', 'package', 'sdk', 'api',
            'github.com', 'npm', 'pypi', 'maven', 'nuget'
        ]
        
        text = (result.title + ' ' + result.description + ' ' + result.url).lower()
        
        return any(indicator in text for indicator in indicators)
    
    def _extract_tool_name(self, result: ResearchResult) -> Optional[str]:
        """Extract tool name from result."""
        if 'github.com' in result.url:
            # Extract repository name from GitHub URL
            parts = result.url.split('/')
            if len(parts) >= 5:
                return parts[4]  # repo name
        
        # Try to extract from title
        title_words = result.title.split()
        if title_words:
            # Remove common prefixes/suffixes
            name = title_words[0]
            for word in title_words:
                if len(word) > 3 and word.lower() not in ['the', 'how', 'what', 'best', 'top']:
                    return word
            return name
        
        return None
    
    def _extract_repo_name(self, url: str) -> str:
        """Extract repository name from GitHub URL."""
        if 'github.com' in url:
            parts = url.split('/')
            if len(parts) >= 5:
                return parts[4]
        return "unknown"
    
    def _check_rate_limit(self, service: str) -> bool:
        """Check if we can make a request to a service without exceeding rate limits."""
        if service not in self.last_requests:
            self.last_requests[service] = []
        
        now = datetime.now()
        limits = self.rate_limits.get(service, {'requests_per_minute': 10})
        
        # Clean old requests
        cutoff = now - timedelta(minutes=1)
        self.last_requests[service] = [req_time for req_time in self.last_requests[service] if req_time > cutoff]
        
        # Check if we can make another request
        return len(self.last_requests[service]) < limits['requests_per_minute']
    
    def _record_request(self, service: str):
        """Record that we made a request to a service."""
        if service not in self.last_requests:
            self.last_requests[service] = []
        
        self.last_requests[service].append(datetime.now())
    
    def get_research_summary(self, results: List[ResearchResult]) -> Dict[str, Any]:
        """Generate a summary of research results."""
        if not results:
            return {'total_results': 0}
        
        summary = {
            'total_results': len(results),
            'sources': {},
            'content_types': {},
            'technologies': {},
            'top_results': [],
            'average_relevance': 0.0
        }
        
        # Count by source
        for result in results:
            summary['sources'][result.source] = summary['sources'].get(result.source, 0) + 1
            summary['content_types'][result.content_type] = summary['content_types'].get(result.content_type, 0) + 1
            
            for tech in result.technology_stack:
                summary['technologies'][tech] = summary['technologies'].get(tech, 0) + 1
        
        # Top 5 results
        summary['top_results'] = [
            {
                'title': r.title,
                'url': r.url,
                'source': r.source,
                'relevance': round(r.relevance_score, 2)
            }
            for r in results[:5]
        ]
        
        # Average relevance
        if results:
            summary['average_relevance'] = sum(r.relevance_score for r in results) / len(results)
        
        return summary