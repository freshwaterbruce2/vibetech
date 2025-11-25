import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Message, Project, Memory, Task, Capability } from '../types';
import { NOVAService } from '../services/nova';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface AppState {
  messages: Message[];
  projects: Project[];
  memories: Memory[];
  tasks: Task[];
  capabilities: Capability[];
  activeProject: string | null;
  isLoading: boolean;
  error: string | null;
  isListening: boolean;
  sidebarOpen: boolean;
}

interface AppContextType extends AppState {
  sendMessage: (content: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  createProject: (name: string, description: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleCapability: (name: string, enabled: boolean) => Promise<void>;
  newChat: () => void;
  toggleVoice: () => void;
  toggleSidebar: () => void;
  clearError: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    messages: [],
    projects: [],
    memories: [],
    tasks: [],
    capabilities: [],
    activeProject: null,
    isLoading: false,
    error: null,
    isListening: false,
    sidebarOpen: true,
  });

  const novaService = useRef(new NOVAService()).current;
  // const voiceInputRef = useRef<string>('');

  const refreshData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [projects, capabilities, memories] = await Promise.all([
        novaService.getProjects(),
        novaService.getCapabilities(),
        novaService.searchMemories('', undefined, 20),
      ]);

      setState(prev => ({
        ...prev,
        projects,
        capabilities,
        memories,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false,
      }));
    }
  }, [novaService]);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await novaService.chat(content, state.activeProject || undefined);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        memories: response.memories ? [...response.memories, ...prev.memories] : prev.memories,
        tasks: response.tasks ? [...response.tasks, ...prev.tasks] : prev.tasks,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
      }));
    }
  }, [state.activeProject, novaService]);

  const selectProject = useCallback((projectId: string | null) => {
    setState(prev => ({ ...prev, activeProject: projectId }));
  }, []);

  const createProject = useCallback(async (name: string, description: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const project = await novaService.createProject({
        name,
        description,
        status: 'active',
      });

      setState(prev => ({
        ...prev,
        projects: [...prev.projects, project],
        activeProject: project.id,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false,
      }));
    }
  }, [novaService]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updated = await novaService.updateProject(id, updates);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? updated : p),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update project',
        isLoading: false,
      }));
    }
  }, [novaService]);

  const createTask = useCallback(async (task: Partial<Task>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const newTask = await novaService.createTask({
        ...task,
        project_id: state.activeProject || undefined,
      });

      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false,
      }));
    }
  }, [state.activeProject, novaService]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updated = await novaService.updateTask(id, updates);

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? updated : t),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false,
      }));
    }
  }, [novaService]);

  const toggleCapability = useCallback(async (name: string, enabled: boolean) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await novaService.toggleCapability(name, enabled);

      setState(prev => ({
        ...prev,
        capabilities: prev.capabilities.map(c => 
          c.name === name ? { ...c, enabled } : c
        ),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to toggle capability',
        isLoading: false,
      }));
    }
  }, [novaService]);

  const newChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      activeProject: null,
    }));
  }, []);

  const { start: startVoice, stop: stopVoice, isSupported: voiceSupported } = useVoiceRecognition({
    onResult: (transcript) => {
      if (transcript.trim()) {
        sendMessage(transcript);
        setState(prev => ({ ...prev, isListening: false }));
      }
    },
    onError: (error) => {
      setState(prev => ({ 
        ...prev, 
        error: `Voice recognition error: ${error}`,
        isListening: false 
      }));
    },
  });

  const toggleVoice = useCallback(() => {
    if (!voiceSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Voice recognition is not supported in your browser' 
      }));
      return;
    }

    setState(prev => {
      const newListening = !prev.isListening;
      if (newListening) {
        startVoice();
      } else {
        stopVoice();
      }
      return { ...prev, isListening: newListening };
    });
  }, [voiceSupported, startVoice, stopVoice]);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AppContextType = {
    ...state,
    sendMessage,
    selectProject,
    createProject,
    updateProject,
    createTask,
    updateTask,
    toggleCapability,
    newChat,
    toggleVoice,
    toggleSidebar,
    clearError,
    refreshData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};