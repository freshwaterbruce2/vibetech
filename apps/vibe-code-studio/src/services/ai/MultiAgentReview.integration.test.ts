import { describe, it, expect } from 'vitest'
import { MultiAgentReviewService } from './MultiAgentReview'

describe('MultiAgentReview Integration', () => {
  it('should perform complete multi-agent review workflow', async () => {
    const service = new MultiAgentReviewService()
    
    const problematicCode = `
      function processUserData(users) {
        let results = []
        for (var i = 0; i <= users.length; i++) {
          const user = users[i]
          if (user.age > 18) {
            results.push({
              name: user.name,
              email: user.email,
              password: user.password // Security issue!
            })
          }
        }
        return results
      }
    `
    
    // Run multi-agent review
    const reviews = await service.reviewCode(problematicCode, 'javascript')
    
    // Should have reviews from all 4 agents
    expect(reviews.length).toBe(4)
    
    // Check agent types
    const agentIds = reviews.map(r => r.agentId)
    expect(agentIds).toContain('security-reviewer')
    expect(agentIds).toContain('performance-reviewer')
    expect(agentIds).toContain('style-reviewer')
    expect(agentIds).toContain('architecture-reviewer')
    
    // Each review should have found issues
    reviews.forEach(review => {
      expect(review.issues.length).toBeGreaterThan(0)
      expect(review.confidence).toBeGreaterThan(0.5)
    })
    
    // Security agent should find password exposure
    const securityReview = reviews.find(r => r.agentId === 'security-reviewer')
    expect(securityReview).toBeDefined()
    const passwordIssue = securityReview?.issues.find(i => 
      i.message.toLowerCase().includes('password') || 
      i.message.toLowerCase().includes('sensitive')
    )
    expect(passwordIssue).toBeDefined()
    
    // Consolidate reviews
    const consensus = await service.consolidateReviews(reviews)
    
    // Should have consensus results
    expect(consensus.criticalIssues.length).toBeGreaterThan(0)
    expect(consensus.consensus).toBeGreaterThan(0.6)
    expect(consensus.suggestions.length).toBeGreaterThan(0)
    
    console.log(`
      Integration Test Results:
      - Reviews: ${reviews.length}
      - Critical Issues: ${consensus.criticalIssues.length}
      - Warnings: ${consensus.warnings.length}
      - Consensus: ${(consensus.consensus * 100).toFixed(0)}%
    `)
  })
})