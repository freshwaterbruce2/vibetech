import { describe, it, expect, beforeEach } from 'vitest';
import { MultiAgentReviewService, CodeReviewResult } from './MultiAgentReview';

describe('MultiAgentReviewService', () => {
  let service: MultiAgentReviewService;

  beforeEach(() => {
    service = new MultiAgentReviewService();
  });

  describe('reviewCode', () => {
    it('should perform multi-agent code review', async () => {
      const code = `
        function calculateTotal(items) {
          let total = 0
          for (let i = 0; i <= items.length; i++) {
            total += items[i].price
          }
          return total
        }
      `;

      const reviews = await service.reviewCode(code, 'javascript');

      expect(reviews).toBeInstanceOf(Array);
      expect(reviews.length).toBeGreaterThan(0);

      // Each review should have the expected structure
      reviews.forEach((review) => {
        expect(review).toHaveProperty('agentId');
        expect(review).toHaveProperty('issues');
        expect(review).toHaveProperty('suggestions');
        expect(review).toHaveProperty('severity');
        expect(review.issues).toBeInstanceOf(Array);
        expect(review.suggestions).toBeInstanceOf(Array);
      });
    });

    it('should handle Python code review', async () => {
      const code = `
        def process_data(data):
            result = []
            for item in data:
                if item > 0:
                    result.append(item * 2)
            return result
      `;

      const reviews = await service.reviewCode(code, 'python');

      expect(reviews).toBeInstanceOf(Array);
      expect(reviews.length).toBeGreaterThan(0);
    });
  });

  describe('consolidateReviews', () => {
    it('should consolidate multiple reviews into consensus', async () => {
      const mockReviews: CodeReviewResult[] = [
        {
          agentId: 'security-agent',
          issues: [
            { message: 'Potential XSS vulnerability', line: 10, column: 5, rule: 'security/xss' },
            {
              message: 'Missing input validation',
              line: 15,
              column: 0,
              rule: 'security/validation',
            },
          ],
          suggestions: ['Add input sanitization', 'Use parameterized queries'],
          severity: 'error' as const,
          confidence: 0.9,
        },
        {
          agentId: 'performance-agent',
          issues: [
            {
              message: 'Inefficient loop structure',
              line: 20,
              column: 0,
              rule: 'performance/loops',
            },
            {
              message: 'Missing input validation',
              line: 15,
              column: 0,
              rule: 'security/validation',
            },
          ],
          suggestions: ['Use array methods instead of loops', 'Cache results'],
          severity: 'warning' as const,
          confidence: 0.7,
        },
      ];

      const consensus = await service.consolidateReviews(mockReviews);

      expect(consensus).toHaveProperty('criticalIssues');
      expect(consensus).toHaveProperty('warnings');
      expect(consensus).toHaveProperty('suggestions');
      expect(consensus).toHaveProperty('consensus');

      expect(consensus.criticalIssues).toBeInstanceOf(Array);
      expect(consensus.warnings).toBeInstanceOf(Array);
      expect(consensus.suggestions).toBeInstanceOf(Array);
      expect(consensus.consensus).toBeGreaterThanOrEqual(0);
      expect(consensus.consensus).toBeLessThanOrEqual(1);
    });

    it('should deduplicate common issues', async () => {
      const mockReviews: CodeReviewResult[] = [
        {
          agentId: 'agent1',
          issues: [
            { message: 'Missing validation', line: 10, column: 0, rule: 'security/validation' },
            { message: 'Unused variable', line: 5, column: 0, rule: 'style/unused' },
          ],
          suggestions: [],
          severity: 'warning' as const,
          confidence: 0.8,
        },
        {
          agentId: 'agent2',
          issues: [
            { message: 'Missing validation', line: 10, column: 0, rule: 'security/validation' },
            { message: 'Memory leak', line: 20, column: 0, rule: 'performance/memory' },
          ],
          suggestions: [],
          severity: 'warning' as const,
          confidence: 0.8,
        },
      ];

      const consensus = await service.consolidateReviews(mockReviews);

      // Should have 3 unique issues, not 4
      const totalIssues = consensus.criticalIssues.length + consensus.warnings.length;
      expect(totalIssues).toBeLessThan(4);
    });
  });
});
