#!/usr/bin/env python3
"""
Memory Bank API Server
Provides HTTP API for Nova Agent to access memory and learning systems
FastAPI-based server for cross-language integration
"""

import asyncio
import json
import sys
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from fastapi import FastAPI, HTTPException, Body
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("ERROR: FastAPI not installed. Run: pip install fastapi uvicorn pydantic")
    sys.exit(1)

from enhanced_memory_manager import EnhancedMemoryManager, MemoryType
from learning_bridge import LearningBridge
from unified_context_service import UnifiedContextService, UnifiedQuery, ContextType

# Initialize services
print("Initializing Memory Bank API Server...")
try:
    memory_manager = EnhancedMemoryManager()
    learning_bridge = LearningBridge(memory_manager)
    context_service = UnifiedContextService()
    print("✅ Memory services initialized")
except Exception as e:
    print(f"❌ Failed to initialize services: {e}")
    sys.exit(1)

# Create FastAPI app
app = FastAPI(
    title="NOVA Memory Bank API",
    description="Memory and learning system API for Nova Agent",
    version="1.0.0"
)

# Enable CORS for localhost (Nova Agent is on same machine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class MemoryQuery(BaseModel):
    query: str
    memory_type: Optional[str] = None
    limit: int = 10

class MemoryStore(BaseModel):
    content: str
    memory_type: str
    metadata: Optional[Dict[str, Any]] = {}

class LearningQuery(BaseModel):
    pattern_type: Optional[str] = None
    min_confidence: float = 0.6
    limit: int = 20

class ContextQueryModel(BaseModel):
    query_text: str
    context_type: str = "unified"
    include_learning: bool = True
    include_memory: bool = True

# Health Check
@app.get("/health")
async def health_check():
    """Check if API server is running"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "memory": "operational",
            "learning": "operational",
            "context": "operational"
        }
    }

# Memory Endpoints
@app.post("/api/memory/query")
async def query_memory(request: MemoryQuery):
    """Query memory system"""
    try:
        # Convert memory type string to enum if provided
        mem_type = None
        if request.memory_type:
            try:
                mem_type = MemoryType[request.memory_type.upper()]
            except KeyError:
                pass

        results = await memory_manager.query_memories(
            request.query,
            memory_type=mem_type,
            limit=request.limit
        )

        return {
            "success": True,
            "count": len(results),
            "memories": [
                {
                    "id": mem.id,
                    "content": mem.content,
                    "type": mem.memory_type.value,
                    "timestamp": mem.timestamp.isoformat(),
                    "relevance_score": mem.relevance_score if hasattr(mem, 'relevance_score') else 0.0,
                    "metadata": mem.metadata
                }
                for mem in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/memory/store")
async def store_memory(request: MemoryStore):
    """Store new memory"""
    try:
        # Convert memory type
        try:
            mem_type = MemoryType[request.memory_type.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid memory type: {request.memory_type}")

        memory_id = await memory_manager.store_memory(
            content=request.content,
            memory_type=mem_type,
            metadata=request.metadata
        )

        return {
            "success": True,
            "memory_id": memory_id,
            "message": "Memory stored successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Learning System Endpoints
@app.post("/api/learning/patterns")
async def get_learning_patterns(request: LearningQuery):
    """Get discovered learning patterns"""
    try:
        patterns = await learning_bridge.get_patterns(
            pattern_type=request.pattern_type,
            min_confidence=request.min_confidence,
            limit=request.limit
        )

        return {
            "success": True,
            "count": len(patterns),
            "patterns": [
                {
                    "pattern_id": p.pattern_id,
                    "type": p.pattern_type.value,
                    "confidence": p.confidence,
                    "frequency": p.frequency,
                    "success_rate": p.success_rate,
                    "description": p.description,
                    "recommendations": p.recommendations,
                    "projects_applicable": p.projects_applicable
                }
                for p in patterns
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/learning/metrics")
async def get_learning_metrics():
    """Get learning system metrics"""
    try:
        metrics = await learning_bridge.get_metrics()

        return {
            "success": True,
            "metrics": {
                "total_patterns": metrics.total_patterns,
                "active_patterns": metrics.active_patterns,
                "avg_confidence": metrics.avg_confidence,
                "success_rate_improvement": metrics.success_rate_improvement,
                "memory_integration_score": metrics.memory_integration_score,
                "cross_project_transfers": metrics.cross_project_transfers,
                "last_analysis": metrics.last_analysis
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Unified Context Endpoint
@app.post("/api/context/unified")
async def query_unified_context(request: ContextQueryModel):
    """Get unified context from all systems"""
    try:
        # Convert context type
        ctx_type = ContextType.UNIFIED
        if request.context_type.upper() in ContextType.__members__:
            ctx_type = ContextType[request.context_type.upper()]

        query = UnifiedQuery(
            query_text=request.query_text,
            context_type=ctx_type,
            include_learning_patterns=request.include_learning,
            include_memory_context=request.include_memory
        )

        context = await context_service.query_unified_context(query)

        return {
            "success": True,
            "context": {
                "synthesis": context.synthesis,
                "confidence": context.confidence_score,
                "sources": context.source_systems,
                "memory_items": len(context.memory_items) if context.memory_items else 0,
                "learning_patterns": len(context.learning_patterns) if context.learning_patterns else 0,
                "recommendations": context.recommendations
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# System Status
@app.get("/api/system/status")
async def get_system_status():
    """Get complete system status"""
    try:
        status = await context_service.get_system_status()

        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CLAUDE.md Integration
@app.post("/api/monorepo/load")
async def load_monorepo_context(claude_md_content: str = Body(...)):
    """Load CLAUDE.md monorepo context into memory"""
    try:
        # Store CLAUDE.md as episodic memory
        memory_id = await memory_manager.store_memory(
            content=claude_md_content,
            memory_type=MemoryType.EPISODIC,
            metadata={
                "source": "CLAUDE.md",
                "type": "monorepo_context",
                "timestamp": datetime.now().isoformat()
            }
        )

        # Extract project patterns and store as procedural knowledge
        # (simplified for now - could be enhanced with NLP)
        lines = claude_md_content.split('\n')
        project_sections = [line for line in lines if line.startswith('## ') or line.startswith('### ')]

        for section in project_sections[:10]:  # Limit to top 10 sections
            await memory_manager.store_memory(
                content=section,
                memory_type=MemoryType.PROCEDURAL,
                metadata={
                    "source": "CLAUDE.md",
                    "type": "project_knowledge"
                }
            )

        return {
            "success": True,
            "message": "CLAUDE.md context loaded successfully",
            "memory_id": memory_id,
            "sections_extracted": len(project_sections)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def start_server(host: str = "127.0.0.1", port: int = 8765):
    """Start the API server"""
    print(f"🚀 Starting Memory Bank API Server on http://{host}:{port}")
    print(f"📚 Swagger docs available at http://{host}:{port}/docs")
    print(f"🔍 Health check: http://{host}:{port}/health")

    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    start_server()
