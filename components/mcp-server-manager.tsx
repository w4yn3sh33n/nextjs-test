'use client';

import { useState, useEffect } from 'react';
import { Plus, Server, Edit3, Trash2, Check, X, Wifi, WifiOff, AlertCircle, Settings, Loader2, Zap, FileText, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MCPServer } from '@/lib/types';
import { MCPStorage } from '@/lib/mcp-storage';
import { mcpClientManager } from '@/lib/mcp-client';

interface MCPServerManagerProps {
  onServerStatusChange?: (serverId: string, status: MCPServer['status']) => void;
}

export function MCPServerManager({ onServerStatusChange }: MCPServerManagerProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    transport: 'http' as 'http' | 'sse' | 'stdio'
  });
  const [error, setError] = useState<string | null>(null);

  console.log('MCPServerManager rendered with servers:', servers.length);

  useEffect(() => {
    try {
      loadServers();
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  }, []);

  const loadServers = () => {
    try {
      const loadedServers = MCPStorage.loadServers();
      setServers(loadedServers);
      setError(null);
    } catch (error) {
      console.error('Error loading servers:', error);
      setError('Failed to load servers');
      setServers([]);
    }
  };

  const handleAddServer = () => {
    try {
      if (!formData.name.trim() || !formData.url.trim()) return;

      const newServer = MCPStorage.addServer({
        name: formData.name.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        transport: formData.transport
      });

      setServers(prev => [...prev, newServer]);
      setFormData({ name: '', description: '', url: '', transport: 'http' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding server:', error);
    }
  };

  const handleEditServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server) {
      setFormData({
        name: server.name,
        description: server.description,
        url: server.url,
        transport: server.transport
      });
      setEditingId(serverId);
    }
  };

  const handleUpdateServer = () => {
    if (!editingId || !formData.name.trim() || !formData.url.trim()) return;

    MCPStorage.updateServer(editingId, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      url: formData.url.trim(),
      transport: formData.transport
    });

    loadServers();
    setEditingId(null);
    setFormData({ name: '', description: '', url: '', transport: 'http' });
  };

  const handleDeleteServer = (serverId: string) => {
    MCPStorage.deleteServer(serverId);
    loadServers();
  };

  const handleConnectServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    // Set connecting status
    MCPStorage.updateServerStatus(serverId, 'connecting');
    loadServers();

    try {
      const result = await mcpClientManager.connectToServer(server);
      
      if (result.success) {
        MCPStorage.updateServer(serverId, {
          status: 'connected',
          serverInfo: result.serverInfo,
          capabilities: result.serverInfo?.capabilities as {
            tools?: boolean;
            prompts?: boolean;
            resources?: boolean;
          }
        });
        loadServers();
        onServerStatusChange?.(serverId, 'connected');
      } else {
        MCPStorage.updateServerStatus(serverId, 'error');
        loadServers();
        onServerStatusChange?.(serverId, 'error');
        console.error('Failed to connect to MCP server:', result.error);
        setError(`연결 실패: ${result.error}`);
        // 5초 후 에러 메시지 자동 제거
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
      MCPStorage.updateServerStatus(serverId, 'error');
      loadServers();
      onServerStatusChange?.(serverId, 'error');
      setError(`연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // 5초 후 에러 메시지 자동 제거
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDisconnectServer = async (serverId: string) => {
    try {
      await mcpClientManager.disconnectFromServer(serverId);
      MCPStorage.updateServerStatus(serverId, 'disconnected');
      loadServers();
      onServerStatusChange?.(serverId, 'disconnected');
    } catch (error) {
      console.error('Error disconnecting from MCP server:', error);
    }
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'connecting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">MCP 서버 관리</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          서버 추가
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? '서버 수정' : '새 서버 추가'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">서버 이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="서버 이름을 입력하세요"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">설명 (선택사항)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="서버 설명을 입력하세요"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">서버 URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/mcp"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                <p>테스트용 URL 예시:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>https://httpbin.org/post (HTTP 테스트)</li>
                  <li>https://jsonplaceholder.typicode.com/posts (JSON API)</li>
                  <li>실제 MCP 서버 URL을 입력하세요</li>
                </ul>
                <p className="mt-2 text-blue-600">
                  💡 MCP 프로토콜을 지원하지 않는 서버도 연결할 수 있습니다. 
                  서버가 실행 중이면 &quot;연결됨&quot;으로 표시됩니다.
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Transport</label>
              <select
                value={formData.transport}
                onChange={(e) => setFormData(prev => ({ ...prev, transport: e.target.value as 'http' | 'sse' | 'stdio' }))}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="http">HTTP (Streamable)</option>
                <option value="sse">SSE (Server-Sent Events)</option>
                <option value="stdio">Stdio (Command Line)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingId ? handleUpdateServer : handleAddServer}
                size="sm"
                disabled={!formData.name.trim() || !formData.url.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                {editingId ? '수정' : '추가'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', url: '', transport: 'http' });
                }}
                size="sm"
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Servers List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {servers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">등록된 MCP 서버가 없습니다</p>
              <p className="text-xs">새 서버를 추가해보세요</p>
            </div>
          ) : (
            servers.map((server) => (
              <Card key={server.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm truncate">{server.name}</h3>
                        <Badge className={`text-xs ${getStatusColor(server.status)}`}>
                          {getStatusIcon(server.status)}
                          <span className="ml-1">
                            {server.status === 'connected' ? '연결됨' : 
                             server.status === 'disconnected' ? '연결 안됨' : 
                             server.status === 'connecting' ? '연결 중...' : '오류'}
                          </span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {server.transport.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {server.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {server.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground font-mono">
                        {server.url}
                      </p>

                      {server.serverInfo && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <div className="font-medium mb-1">서버 정보</div>
                          <div className="space-y-1">
                            {server.serverInfo.name && (
                              <div>이름: {server.serverInfo.name}</div>
                            )}
                            {server.serverInfo.version && (
                              <div>버전: {server.serverInfo.version}</div>
                            )}
                            {server.serverInfo.description && (
                              <div>설명: {server.serverInfo.description}</div>
                            )}
                            {server.serverInfo.mcpSupported !== undefined && (
                              <div className="flex items-center gap-1">
                                MCP 지원: 
                                <Badge 
                                  variant={server.serverInfo.mcpSupported ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {server.serverInfo.mcpSupported ? "지원" : "미지원"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {server.capabilities && (
                        <div className="mt-2 flex gap-1">
                          {server.capabilities.tools && (
                            <Badge variant="secondary" className="text-xs">
                              <Wrench className="h-3 w-3 mr-1" />
                              Tools
                            </Badge>
                          )}
                          {server.capabilities.prompts && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Prompts
                            </Badge>
                          )}
                          {server.capabilities.resources && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Resources
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>생성: {formatDate(server.createdAt)}</span>
                        {server.lastConnected && (
                          <span>마지막 연결: {formatDate(server.lastConnected)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {server.status === 'connected' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnectServer(server.id)}
                          className="h-8 px-2 text-xs"
                        >
                          <WifiOff className="h-3 w-3 mr-1" />
                          연결 해제
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectServer(server.id)}
                          className="h-8 px-2 text-xs"
                        >
                          <Wifi className="h-3 w-3 mr-1" />
                          연결
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditServer(server.id)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteServer(server.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
