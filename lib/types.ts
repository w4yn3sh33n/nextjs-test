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
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPServerConfig {
  servers: MCPServer[];
}
