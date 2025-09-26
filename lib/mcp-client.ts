// MCP SDK는 서버 사이드에서만 사용
// import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
// import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { MCPServer } from './types';

export class MCPClientManager {
  private connectedServers: Set<string> = new Set();

  async connectToServer(server: MCPServer): Promise<{ success: boolean; error?: string; serverInfo?: Record<string, unknown> }> {
    try {
      // Use API route for MCP connection
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          serverId: server.id,
          url: server.url,
          transport: server.transport
        })
      });

      if (response.ok) {
        await response.json();
        this.connectedServers.add(server.id);
        
        return {
          success: true,
          serverInfo: {
            name: server.name,
            version: '1.0.0',
            description: server.description,
            capabilities: {
              tools: true, // Assume capabilities for now
              prompts: true,
              resources: true
            }
          }
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: error || 'Connection failed'
        };
      }
    } catch (error) {
      console.error(`Error connecting to MCP server ${server.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async disconnectFromServer(serverId: string): Promise<void> {
    try {
      const response = await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId })
      });

      if (response.ok) {
        this.connectedServers.delete(serverId);
        console.log(`Disconnected from server ${serverId}`);
      }
    } catch (error) {
      console.error(`Error disconnecting from server ${serverId}:`, error);
    }
  }

  async callTool(serverId: string, toolName: string, arguments_: Record<string, unknown>): Promise<unknown> {
    const response = await fetch('/api/mcp/call-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        serverId, 
        toolName, 
        arguments: arguments_ 
      })
    });

    if (!response.ok) {
      throw new Error('Tool call failed');
    }

    return await response.json();
  }

  async listTools(serverId: string): Promise<unknown> {
    const response = await fetch('/api/mcp/list-tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId })
    });

    if (!response.ok) {
      throw new Error('Failed to list tools');
    }

    return await response.json();
  }

  async listPrompts(serverId: string): Promise<unknown> {
    const response = await fetch('/api/mcp/list-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId })
    });

    if (!response.ok) {
      throw new Error('Failed to list prompts');
    }

    return await response.json();
  }

  async listResources(serverId: string): Promise<unknown> {
    const response = await fetch('/api/mcp/list-resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId })
    });

    if (!response.ok) {
      throw new Error('Failed to list resources');
    }

    return await response.json();
  }

  isConnected(serverId: string): boolean {
    return this.connectedServers.has(serverId);
  }

  getConnectedServers(): string[] {
    return Array.from(this.connectedServers);
  }
}

// Singleton instance
export const mcpClientManager = new MCPClientManager();
