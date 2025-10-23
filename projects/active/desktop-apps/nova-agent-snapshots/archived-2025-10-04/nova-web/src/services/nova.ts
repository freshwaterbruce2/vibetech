import axios from 'axios';
import { Project, Task, Memory, AgentResponse, Capability } from '../types';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.nova !== undefined;
};

// Get API URL dynamically
const getAPIUrl = async () => {
  if (isElectron()) {
    try {
      const endpoint = await window.nova.getAPIEndpoint();
      return endpoint;
    } catch (error) {
      console.error('Failed to get API endpoint from Electron:', error);
    }
  }
  // Fallback for development or web-only mode
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

export class NOVAService {
  private api = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Set base URL dynamically
    this.initializeAPI();
  }

  private async initializeAPI() {
    const baseURL = await getAPIUrl();
    this.api.defaults.baseURL = baseURL;
  }

  async chat(message: string, projectId?: string, onStream?: (chunk: string) => void): Promise<AgentResponse> {
    if (onStream) {
      // Streaming mode using EventSource
      return new Promise((resolve, reject) => {
        const baseURL = this.api.defaults.baseURL || '';
        const eventSource = new EventSource(`${baseURL}/chat/stream?message=${encodeURIComponent(message)}&projectId=${projectId || ''}`);
        
        let fullResponse = '';
        let metadata: any = {};
        
        eventSource.addEventListener('chunk', (event) => {
          const data = JSON.parse(event.data);
          fullResponse += data.content;
          onStream(data.content);
        });
        
        eventSource.addEventListener('complete', (event) => {
          const data = JSON.parse(event.data);
          metadata = data;
          eventSource.close();
          
          resolve({
            content: fullResponse,
            memories: metadata.memories || [],
            tasks: metadata.tasks || [],
            suggestions: metadata.suggestions || [],
            confidence: metadata.confidence || 1,
          });
        });
        
        eventSource.addEventListener('error', (event) => {
          eventSource.close();
          reject(new Error('Streaming failed'));
        });
        
        eventSource.onerror = () => {
          eventSource.close();
          reject(new Error('Connection failed'));
        };
      });
    } else {
      // Non-streaming mode
      const response = await this.api.post('/chat', { message, projectId });
      return response.data;
    }
  }

  async getProjects(status?: string): Promise<Project[]> {
    const response = await this.api.get('/projects', { params: { status } });
    return response.data.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      tasks: p.tasks.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      })),
    }));
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const response = await this.api.post('/projects', project);
    return response.data;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const response = await this.api.put(`/projects/${id}`, updates);
    return response.data;
  }

  async getTasks(filter?: any): Promise<Task[]> {
    const response = await this.api.get('/tasks', { params: filter });
    return response.data.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
    }));
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const response = await this.api.post('/tasks', task);
    return response.data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.api.put(`/tasks/${id}`, updates);
    return response.data;
  }

  async searchMemories(query: string, type?: string, limit?: number): Promise<Memory[]> {
    const response = await this.api.get('/memories', {
      params: { query, type, limit },
    });
    return response.data.map((m: any) => ({
      ...m,
      metadata: {
        ...m.metadata,
        timestamp: new Date(m.metadata.timestamp),
      },
    }));
  }

  async storeMemory(memory: Partial<Memory>): Promise<Memory> {
    const response = await this.api.post('/memories', memory);
    return response.data;
  }

  async getCapabilities(): Promise<Capability[]> {
    const response = await this.api.get('/capabilities');
    return response.data;
  }

  async toggleCapability(name: string, enabled: boolean): Promise<void> {
    await this.api.put(`/capabilities/${name}`, { enabled });
  }

  async startNewConversation(): Promise<void> {
    await this.api.post('/conversations/new');
  }
}