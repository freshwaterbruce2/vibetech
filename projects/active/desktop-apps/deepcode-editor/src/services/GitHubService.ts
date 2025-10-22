/**
 * GitHubService - GitHub API integration
 * Handles PRs, issues, code review, and branch management
 */

export interface Repository {
  owner: string;
  repo: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body?: string;
  state: string;
  html_url?: string;
  user?: { login: string };
  head?: { ref: string };
  base?: { ref: string };
}

export interface PullRequestFile {
  filename: string;
  status: string;
  changes: number;
  patch?: string;
}

export interface ReviewComment {
  id: number;
  body: string;
  path?: string;
  line?: number;
  user?: { login: string };
  commit_id?: string;
}

export interface Review {
  id: number;
  state: string;
  body?: string;
}

export interface Issue {
  number: number;
  title: string;
  body?: string;
  state: string;
  html_url?: string;
}

export interface Branch {
  name: string;
  protected: boolean;
}

export interface BranchComparison {
  ahead_by: number;
  behind_by: number;
  total_commits: number;
}

export class GitHubService {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    if (!token || token.trim() === '') {
      throw new Error('GitHub token is required');
    }
    this.token = token;
  }

  /**
   * Parse repository info from GitHub URL
   */
  parseRepoFromUrl(url: string): Repository {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }

  /**
   * Validate token format
   */
  isValidToken(token: string): boolean {
    return /^(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]+$/.test(token);
  }

  /**
   * Check authentication
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await this.fetch('/user');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List pull requests
   */
  async listPullRequests(repo: Repository, state: string = 'open'): Promise<PullRequest[]> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/pulls?state=${state}`);
    return response.json();
  }

  /**
   * Get pull request details
   */
  async getPullRequest(repo: Repository, prNumber: number): Promise<PullRequest> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}`);
    return response.json();
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    repo: Repository,
    data: { title: string; body?: string; head: string; base: string }
  ): Promise<PullRequest> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * Get PR diff
   */
  async getPullRequestDiff(repo: Repository, prNumber: number): Promise<string> {
    const response = await this.fetch(
      `/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3.diff'
        }
      }
    );
    return response.text();
  }

  /**
   * Get PR files
   */
  async getPullRequestFiles(repo: Repository, prNumber: number): Promise<PullRequestFile[]> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}/files`);
    return response.json();
  }

  /**
   * Create review comment
   */
  async createReviewComment(
    repo: Repository,
    prNumber: number,
    comment: { body: string; commit_id: string; path: string; line: number }
  ): Promise<ReviewComment> {
    const response = await this.fetch(
      `/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(comment)
      }
    );
    return response.json();
  }

  /**
   * Submit review
   */
  async submitReview(
    repo: Repository,
    prNumber: number,
    review: { event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'; body?: string }
  ): Promise<Review> {
    const response = await this.fetch(
      `/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(review)
      }
    );
    return response.json();
  }

  /**
   * Get review comments
   */
  async getReviewComments(repo: Repository, prNumber: number): Promise<ReviewComment[]> {
    const response = await this.fetch(
      `/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}/comments`
    );
    return response.json();
  }

  /**
   * List issues
   */
  async listIssues(repo: Repository, state: string = 'open'): Promise<Issue[]> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/issues?state=${state}`);
    return response.json();
  }

  /**
   * Create issue
   */
  async createIssue(
    repo: Repository,
    data: { title: string; body?: string; labels?: string[] }
  ): Promise<Issue> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * Update issue
   */
  async updateIssue(
    repo: Repository,
    issueNumber: number,
    data: { state?: string; title?: string; body?: string }
  ): Promise<Issue> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * List branches
   */
  async listBranches(repo: Repository): Promise<Branch[]> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/branches`);
    return response.json();
  }

  /**
   * Compare branches
   */
  async compareBranches(repo: Repository, base: string, head: string): Promise<BranchComparison> {
    const response = await this.fetch(`/repos/${repo.owner}/${repo.repo}/compare/${base}...${head}`);
    return response.json();
  }

  /**
   * Make authenticated fetch request
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));

        if (response.status === 429) {
          throw new Error('GitHub API rate limit exceeded');
        }

        throw new Error(`GitHub API error ${response.status}: ${error.message}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('GitHub API')) {
        throw error;
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
