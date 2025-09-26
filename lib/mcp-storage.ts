import { MCPServer, MCPServerConfig } from './types';

const MCP_SERVERS_KEY = 'mcp-servers';

export class MCPStorage {
  static loadServers(): MCPServer[] {
    try {
      const stored = localStorage.getItem(MCP_SERVERS_KEY);
      if (!stored) {
        return [];
      }
      
      const parsed = JSON.parse(stored);
      return parsed.servers.map((server: {
        id: string;
        name: string;
        description: string;
        url: string;
        status: 'connected' | 'disconnected' | 'error';
        lastConnected?: string;
        createdAt: string;
        updatedAt: string;
      }) => ({
        ...server,
        createdAt: new Date(server.createdAt),
        updatedAt: new Date(server.updatedAt),
        lastConnected: server.lastConnected ? new Date(server.lastConnected) : undefined
      }));
    } catch (error) {
      console.error('Error loading MCP servers:', error);
      return [];
    }
  }

  static saveServers(servers: MCPServer[]): void {
    try {
      const config: MCPServerConfig = { servers };
      localStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving MCP servers:', error);
    }
  }

  static addServer(server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MCPServer {
    const now = new Date();
    const newServer: MCPServer = {
      ...server,
      id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'disconnected',
      createdAt: now,
      updatedAt: now
    };

    const servers = this.loadServers();
    servers.push(newServer);
    this.saveServers(servers);
    
    return newServer;
  }

  static updateServer(serverId: string, updates: Partial<Omit<MCPServer, 'id' | 'createdAt'>>): void {
    const servers = this.loadServers();
    const serverIndex = servers.findIndex(s => s.id === serverId);
    
    if (serverIndex !== -1) {
      servers[serverIndex] = {
        ...servers[serverIndex],
        ...updates,
        updatedAt: new Date()
      };
      this.saveServers(servers);
    }
  }

  static deleteServer(serverId: string): void {
    const servers = this.loadServers();
    const filteredServers = servers.filter(s => s.id !== serverId);
    this.saveServers(filteredServers);
  }

  static updateServerStatus(serverId: string, status: MCPServer['status']): void {
    const servers = this.loadServers();
    const server = servers.find(s => s.id === serverId);
    
    if (server) {
      server.status = status;
      if (status === 'connected') {
        server.lastConnected = new Date();
      }
      server.updatedAt = new Date();
      this.saveServers(servers);
    }
  }
}
