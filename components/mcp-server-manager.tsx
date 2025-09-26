'use client';

import { useState, useEffect } from 'react';
import { Plus, Server, Edit3, Trash2, Check, X, Wifi, WifiOff, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MCPServer } from '@/lib/types';
import { MCPStorage } from '@/lib/mcp-storage';

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
    url: ''
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = () => {
    const loadedServers = MCPStorage.loadServers();
    setServers(loadedServers);
  };

  const handleAddServer = () => {
    if (!formData.name.trim() || !formData.url.trim()) return;

    const newServer = MCPStorage.addServer({
      name: formData.name.trim(),
      description: formData.description.trim(),
      url: formData.url.trim()
    });

    setServers(prev => [...prev, newServer]);
    setFormData({ name: '', description: '', url: '' });
    setShowAddForm(false);
  };

  const handleEditServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server) {
      setFormData({
        name: server.name,
        description: server.description,
        url: server.url
      });
      setEditingId(serverId);
    }
  };

  const handleUpdateServer = () => {
    if (!editingId || !formData.name.trim() || !formData.url.trim()) return;

    MCPStorage.updateServer(editingId, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      url: formData.url.trim()
    });

    loadServers();
    setEditingId(null);
    setFormData({ name: '', description: '', url: '' });
  };

  const handleDeleteServer = (serverId: string) => {
    MCPStorage.deleteServer(serverId);
    loadServers();
  };

  const handleConnectServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    try {
      // MCP 서버 연결 시도
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId, url: server.url })
      });

      if (response.ok) {
        MCPStorage.updateServerStatus(serverId, 'connected');
        loadServers();
        onServerStatusChange?.(serverId, 'connected');
      } else {
        MCPStorage.updateServerStatus(serverId, 'error');
        loadServers();
        onServerStatusChange?.(serverId, 'error');
      }
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
      MCPStorage.updateServerStatus(serverId, 'error');
      loadServers();
      onServerStatusChange?.(serverId, 'error');
    }
  };

  const handleDisconnectServer = async (serverId: string) => {
    try {
      const response = await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId })
      });

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
                  setFormData({ name: '', description: '', url: '' });
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
                             server.status === 'disconnected' ? '연결 안됨' : '오류'}
                          </span>
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
