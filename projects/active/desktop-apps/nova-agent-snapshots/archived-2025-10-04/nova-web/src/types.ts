export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  type: "conversation" | "fact" | "preference" | "project" | "task";
  content: string;
  metadata?: any;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface Capability {
  name: string;
  enabled: boolean;
  description: string;
}

export interface AgentResponse {
  content: string;
  memories?: Memory[];
  tasks?: Task[];
  suggestions?: string[];
  confidence: number;
}
