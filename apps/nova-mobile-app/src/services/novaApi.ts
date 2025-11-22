import { config, getApiUrl } from '../config';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  content: string;
  memories?: any[];
  tasks?: any[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

class NOVAApiService {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = getApiUrl(endpoint);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async chat(message: string, projectId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        projectId,
        stream: false,
      }),
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async searchMemories(query: string): Promise<any[]> {
    return this.request<any[]>(`/memories?query=${encodeURIComponent(query)}`);
  }

  async getCapabilities(): Promise<any[]> {
    return this.request<any[]>('/capabilities');
  }

  async updateCapability(name: string, enabled: boolean): Promise<void> {
    await this.request(`/capabilities/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }
}

export const novaApi = new NOVAApiService();