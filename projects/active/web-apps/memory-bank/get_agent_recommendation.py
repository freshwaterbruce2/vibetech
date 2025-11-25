#!/usr/bin/env python3
"""
Quick Agent Recommendation Script
Called by PowerShell hooks to get agent recommendations
"""

import sys
import json
import asyncio
from agent_memory_bridge import AgentMemoryBridge

async def main():
    """Get agent recommendation for context"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No context provided"}))
        return 1

    context = sys.argv[1]

    try:
        bridge = AgentMemoryBridge()
        recommendations = await bridge.get_agent_recommendations(context)

        if recommendations:
            # Return top recommendation
            top_rec = recommendations[0]
            result = {
                "agent": top_rec['agent_name'],
                "confidence": top_rec['confidence'],
                "reason": top_rec['reasons'][0] if top_rec['reasons'] else ""
            }
        else:
            result = {"agent": None}

        print(json.dumps(result))
        return 0

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
