#!/usr/bin/env python3
"""
RESTful API for Prompt Engineer

FastAPI-based REST API providing programmatic access to project analysis
with authentication, rate limiting, and comprehensive documentation.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
import asyncio
import time
import json
from pathlib import Path
from datetime import datetime, timedelta
import uuid
import hashlib
import os

# Import our analyzers and cache system
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from analyzers.project_intelligence import ProjectIntelligenceAnalyzer
from core.async_analyzer import AsyncAnalysisManager, AsyncAnalysisProgress
from cache.redis_cache import SmartCache, CacheEnabledAnalyzer

# Pydantic models for API
class AnalysisRequest(BaseModel):
    """Request model for project analysis."""
    project_path: str = Field(..., description="Absolute path to project directory")
    max_files: int = Field(1000, ge=1, le=10000, description="Maximum files to analyze")
    enable_async: bool = Field(True, description="Use async analysis for better performance")
    enable_cache: bool = Field(True, description="Enable caching for faster repeat analysis")
    include_test_execution: bool = Field(False, description="Execute tests during analysis")
    
    @validator('project_path')
    def validate_project_path(cls, v):
        path = Path(v)
        if not path.exists():
            raise ValueError(f"Project path does not exist: {v}")
        if not path.is_dir():
            raise ValueError(f"Project path must be a directory: {v}")
        return str(path.resolve())

class AnalysisResponse(BaseModel):
    """Response model for analysis results."""
    analysis_id: str
    project_path: str
    status: str  # 'completed', 'failed', 'in_progress'
    health_score: Optional[int] = None
    total_issues: Optional[int] = None
    analysis_timestamp: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    cached: bool = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class AnalysisStatus(BaseModel):
    """Status model for ongoing analysis."""
    analysis_id: str
    status: str
    progress_percent: int = 0
    current_stage: Optional[str] = None
    files_processed: int = 0
    total_files: int = 0
    elapsed_time: float = 0
    estimated_remaining: Optional[str] = None
    error: Optional[str] = None

class CacheStats(BaseModel):
    """Cache statistics model."""
    hits: int
    misses: int
    hit_rate_percent: float
    total_requests: int
    entries: int
    backend: str
    memory_cache_size: Optional[int] = None

class ProjectSummary(BaseModel):
    """Summary model for analyzed projects."""
    project_path: str
    project_name: str
    last_analyzed: str
    health_score: int
    total_issues: int
    analysis_time: float

# Initialize FastAPI app
app = FastAPI(
    title="Prompt Engineer API",
    description="RESTful API for intelligent project analysis and prompt engineering",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Initialize components
security = HTTPBearer(auto_error=False)
cache_system = SmartCache(redis_url=os.getenv('REDIS_URL'))

# In-memory stores (use Redis in production)
analysis_tasks: Dict[str, Dict[str, Any]] = {}
analysis_results: Dict[str, AnalysisResponse] = {}
api_keys: Dict[str, Dict[str, Any]] = {
    "demo-key-12345": {"name": "Demo User", "tier": "free", "requests_per_hour": 10}
}
request_counts: Dict[str, List[float]] = {}

# Rate limiting
async def check_rate_limit(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Check API rate limits."""
    api_key = "anonymous"
    rate_limit = 5  # Default for anonymous users
    
    if credentials:
        api_key = credentials.credentials
        if api_key in api_keys:
            rate_limit = api_keys[api_key]["requests_per_hour"]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
    
    # Simple rate limiting (use Redis in production)
    now = time.time()
    hour_ago = now - 3600
    
    if api_key not in request_counts:
        request_counts[api_key] = []
    
    # Clean old requests
    request_counts[api_key] = [req_time for req_time in request_counts[api_key] if req_time > hour_ago]
    
    if len(request_counts[api_key]) >= rate_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Max {rate_limit} requests per hour."
        )
    
    request_counts[api_key].append(now)
    return api_key

@app.get("/", tags=["General"])
async def root():
    """API root endpoint with basic information."""
    return {
        "service": "Prompt Engineer API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
        "endpoints": {
            "analyze": "/analyze",
            "status": "/analysis/{analysis_id}/status",
            "results": "/analysis/{analysis_id}",
            "cache": "/cache/stats"
        }
    }

@app.get("/health", tags=["General"])
async def health_check():
    """Health check endpoint."""
    cache_health = cache_system.health_check()
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "cache": cache_health,
        "active_analyses": len(analysis_tasks),
        "completed_analyses": len(analysis_results)
    }

@app.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def start_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(check_rate_limit)
):
    """Start asynchronous project analysis."""
    
    analysis_id = str(uuid.uuid4())
    
    # Initialize analysis task
    analysis_tasks[analysis_id] = {
        'status': 'starting',
        'progress': 0,
        'start_time': time.time(),
        'project_path': request.project_path,
        'config': request.dict(),
        'api_key': api_key
    }
    
    # Start background analysis
    background_tasks.add_task(
        perform_background_analysis,
        analysis_id,
        request
    )
    
    return AnalysisResponse(
        analysis_id=analysis_id,
        project_path=request.project_path,
        status="in_progress",
        cached=False
    )

@app.get("/analysis/{analysis_id}/status", response_model=AnalysisStatus, tags=["Analysis"])
async def get_analysis_status(analysis_id: str, api_key: str = Depends(check_rate_limit)):
    """Get status of ongoing analysis."""
    
    if analysis_id not in analysis_tasks and analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if analysis_id in analysis_results:
        # Analysis completed
        result = analysis_results[analysis_id]
        return AnalysisStatus(
            analysis_id=analysis_id,
            status=result.status,
            progress_percent=100 if result.status == "completed" else 0,
            files_processed=result.total_issues or 0,
            elapsed_time=result.processing_time_seconds or 0,
            error=result.error
        )
    
    # Analysis in progress
    task_info = analysis_tasks[analysis_id]
    elapsed = time.time() - task_info['start_time']
    
    return AnalysisStatus(
        analysis_id=analysis_id,
        status=task_info['status'],
        progress_percent=task_info.get('progress', 0),
        current_stage=task_info.get('current_stage'),
        files_processed=task_info.get('files_processed', 0),
        total_files=task_info.get('total_files', 0),
        elapsed_time=elapsed,
        estimated_remaining=task_info.get('estimated_remaining')
    )

@app.get("/analysis/{analysis_id}", response_model=AnalysisResponse, tags=["Analysis"])
async def get_analysis_result(analysis_id: str, api_key: str = Depends(check_rate_limit)):
    """Get completed analysis results."""
    
    if analysis_id not in analysis_results:
        if analysis_id in analysis_tasks:
            raise HTTPException(
                status_code=202, 
                detail="Analysis still in progress. Check /analysis/{analysis_id}/status"
            )
        else:
            raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis_results[analysis_id]

@app.delete("/analysis/{analysis_id}", tags=["Analysis"])
async def cancel_analysis(analysis_id: str, api_key: str = Depends(check_rate_limit)):
    """Cancel ongoing analysis."""
    
    if analysis_id in analysis_tasks:
        analysis_tasks[analysis_id]['status'] = 'cancelled'
        return {"message": "Analysis cancelled", "analysis_id": analysis_id}
    elif analysis_id in analysis_results:
        return {"message": "Analysis already completed", "analysis_id": analysis_id}
    else:
        raise HTTPException(status_code=404, detail="Analysis not found")

@app.get("/analyses", response_model=List[ProjectSummary], tags=["Analysis"])
async def list_analyses(api_key: str = Depends(check_rate_limit)):
    """List all completed analyses for the API key."""
    
    summaries = []
    for analysis_id, result in analysis_results.items():
        if result.status == "completed" and result.result:
            summaries.append(ProjectSummary(
                project_path=result.project_path,
                project_name=Path(result.project_path).name,
                last_analyzed=result.analysis_timestamp or "",
                health_score=result.health_score or 0,
                total_issues=result.total_issues or 0,
                analysis_time=result.processing_time_seconds or 0
            ))
    
    return summaries

@app.get("/cache/stats", response_model=CacheStats, tags=["Cache"])
async def get_cache_stats(api_key: str = Depends(check_rate_limit)):
    """Get cache performance statistics."""
    
    stats = cache_system.get_cache_stats()
    
    return CacheStats(
        hits=stats['hits'],
        misses=stats['misses'],
        hit_rate_percent=stats['hit_rate_percent'],
        total_requests=stats['total_requests'],
        entries=stats['entries'],
        backend=stats['backend'],
        memory_cache_size=stats.get('memory_cache_size')
    )

@app.delete("/cache", tags=["Cache"])
async def clear_cache(api_key: str = Depends(check_rate_limit)):
    """Clear all cached analysis results."""
    
    # Only allow cache clearing for specific API keys
    if api_key not in api_keys:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    cache_system.clear_all_cache()
    return {"message": "Cache cleared successfully"}

# Background analysis function
async def perform_background_analysis(analysis_id: str, request: AnalysisRequest):
    """Perform analysis in background with progress tracking."""
    
    try:
        # Update progress callback
        def progress_callback(progress: AsyncAnalysisProgress):
            if analysis_id in analysis_tasks:
                analysis_tasks[analysis_id].update({
                    'progress': progress.progress,
                    'current_stage': progress.stage,
                    'files_processed': progress.files_processed,
                    'total_files': progress.total_files,
                    'estimated_remaining': progress.estimated_remaining
                })
        
        start_time = time.time()
        
        if request.enable_async:
            # Use async analyzer
            result = await AsyncAnalysisManager.analyze_project(
                project_path=request.project_path,
                max_files=request.max_files,
                progress_callback=progress_callback
            )
        else:
            # Use sync analyzer with cache
            analyzer = ProjectIntelligenceAnalyzer()
            if request.enable_cache:
                cached_analyzer = CacheEnabledAnalyzer(analyzer, cache_system)
                result = cached_analyzer.analyze_project(
                    request.project_path,
                    {'max_files': request.max_files}
                )
            else:
                result = analyzer.analyze_project(request.project_path, request.max_files)
        
        processing_time = time.time() - start_time
        
        # Convert result to dict if it's a dataclass
        if hasattr(result, '__dict__'):
            result_dict = {
                'project_path': result.project_path,
                'analysis_timestamp': result.analysis_timestamp,
                'project_type': result.project_type,
                'health_score': result.health_score,
                'critical_issues': [issue.__dict__ for issue in result.critical_issues],
                'high_priority_issues': [issue.__dict__ for issue in result.high_priority_issues],
                'medium_priority_issues': [issue.__dict__ for issue in result.medium_priority_issues],
                'low_priority_issues': [issue.__dict__ for issue in result.low_priority_issues],
                'suggestions': result.suggestions,
                'tech_stack': result.tech_stack,
                'missing_features': result.missing_features,
                'code_quality_metrics': result.code_quality_metrics
            }
        else:
            result_dict = result
        
        # Store completed result
        total_issues = (len(result.critical_issues) + len(result.high_priority_issues) + 
                       len(result.medium_priority_issues) + len(result.low_priority_issues))
        
        analysis_results[analysis_id] = AnalysisResponse(
            analysis_id=analysis_id,
            project_path=request.project_path,
            status="completed",
            health_score=result.health_score,
            total_issues=total_issues,
            analysis_timestamp=datetime.utcnow().isoformat(),
            processing_time_seconds=round(processing_time, 2),
            cached=request.enable_cache,
            result=result_dict
        )
        
        # Clean up task
        if analysis_id in analysis_tasks:
            del analysis_tasks[analysis_id]
            
    except Exception as e:
        # Handle analysis error
        analysis_results[analysis_id] = AnalysisResponse(
            analysis_id=analysis_id,
            project_path=request.project_path,
            status="failed",
            error=str(e)
        )
        
        if analysis_id in analysis_tasks:
            del analysis_tasks[analysis_id]

# WebSocket endpoint for real-time updates
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    """Manage WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, analysis_id: str):
        await websocket.accept()
        self.active_connections[analysis_id] = websocket
    
    def disconnect(self, analysis_id: str):
        if analysis_id in self.active_connections:
            del self.active_connections[analysis_id]
    
    async def send_update(self, analysis_id: str, data: dict):
        if analysis_id in self.active_connections:
            try:
                await self.active_connections[analysis_id].send_json(data)
            except:
                self.disconnect(analysis_id)

connection_manager = ConnectionManager()

@app.websocket("/ws/analysis/{analysis_id}")
async def websocket_analysis_updates(websocket: WebSocket, analysis_id: str):
    """WebSocket endpoint for real-time analysis updates."""
    
    await connection_manager.connect(websocket, analysis_id)
    
    try:
        while True:
            # Send periodic updates
            if analysis_id in analysis_tasks:
                task_info = analysis_tasks[analysis_id]
                await websocket.send_json({
                    'type': 'progress',
                    'analysis_id': analysis_id,
                    'status': task_info['status'],
                    'progress': task_info.get('progress', 0),
                    'current_stage': task_info.get('current_stage'),
                    'files_processed': task_info.get('files_processed', 0),
                    'total_files': task_info.get('total_files', 0)
                })
            elif analysis_id in analysis_results:
                result = analysis_results[analysis_id]
                await websocket.send_json({
                    'type': 'completed',
                    'analysis_id': analysis_id,
                    'status': result.status,
                    'health_score': result.health_score,
                    'total_issues': result.total_issues
                })
                break
            
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except WebSocketDisconnect:
        connection_manager.disconnect(analysis_id)

if __name__ == "__main__":
    import uvicorn
    
    print("Starting Prompt Engineer API...")
    print("Documentation available at: http://localhost:8000/docs")
    
    uvicorn.run(
        "rest_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )