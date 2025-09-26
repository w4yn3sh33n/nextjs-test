'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit3, Check, X, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatSession } from '@/lib/types';
import { MCPServerManager } from '@/components/mcp-server-manager';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onSessionDelete,
  onSessionRename
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'mcp'>('chats');

  console.log('ChatSidebar rendered with activeTab:', activeTab);

  const handleEditStart = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = () => {
    if (editingId && editTitle.trim()) {
      onSessionRename(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <button
          type="button"
          onClick={() => {
            console.log('New Chat button clicked');
            onNewChat();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sidebar-border">
        <button
          type="button"
          onClick={() => {
            console.log('Chats tab clicked');
            setActiveTab('chats');
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'chats'
              ? 'bg-gray-100 text-gray-900 border-b-2 border-blue-500 dark:bg-gray-800 dark:text-gray-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Chats
        </button>
        <button
          type="button"
          onClick={() => {
            console.log('MCP Servers tab clicked');
            setActiveTab('mcp');
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'mcp'
              ? 'bg-gray-100 text-gray-900 border-b-2 border-blue-500 dark:bg-gray-800 dark:text-gray-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          }`}
        >
          <Server className="h-4 w-4" />
          MCP Servers
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'chats' ? (
          <div className="p-4">
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No chat history yet</p>
                  <p className="text-xs">Start a new conversation!</p>
                </div>
              ) : (
                sessions
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .map((session) => (
                    <Card
                      key={session.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
                        currentSessionId === session.id
                          ? 'ring-2 ring-sidebar-ring bg-sidebar-accent'
                          : 'hover:bg-sidebar-accent'
                      }`}
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingId === session.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave();
                                    if (e.key === 'Escape') handleEditCancel();
                                  }}
                                  className="flex-1 text-sm font-medium bg-transparent border-none outline-none"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSave();
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCancel();
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium truncate">
                                  {session.title || 'Untitled Chat'}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {session.messages.length}
                                </Badge>
                              </div>
                            )}
                            
                            {session.summary && editingId !== session.id && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {session.summary}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(session.updatedAt)}
                            </p>
                          </div>
                          
                          {editingId !== session.id && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStart(session);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSessionDelete(session.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <MCPServerManager />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
