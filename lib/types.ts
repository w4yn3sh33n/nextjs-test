export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  summary: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistory {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  transport: 'http' | 'sse' | 'stdio';
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastConnected?: Date;
  capabilities?: {
    tools?: boolean;
    prompts?: boolean;
    resources?: boolean;
  };
  serverInfo?: {
    name?: string;
    version?: string;
    description?: string;
    mcpSupported?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPServerConfig {
  servers: MCPServer[];
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}
