'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Copy, Check, Bot, User, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChatSidebar } from '@/components/chat-sidebar';
import { Message, ChatSession, ChatHistory } from '@/lib/types';
import { ChatStorage } from '@/lib/chat-storage';

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState<ChatHistory>({ sessions: [], currentSessionId: null });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const history = ChatStorage.loadHistory();
    setChatHistory(history);
    
    // Load messages for current session
    if (history.currentSessionId) {
      const currentSession = history.sessions.find(s => s.id === history.currentSessionId);
      if (currentSession) {
        setMessages(currentSession.messages);
      }
    }
  }, []);

  // Save chat history whenever it changes
  useEffect(() => {
    ChatStorage.saveHistory(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Session management functions
  const handleNewChat = () => {
    const newSession = ChatStorage.createNewSession();
    setChatHistory(prev => ({
      sessions: [...prev.sessions, newSession],
      currentSessionId: newSession.id
    }));
    setMessages([]);
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = chatHistory.sessions.find(s => s.id === sessionId);
    if (session) {
      setChatHistory(prev => ({ ...prev, currentSessionId: sessionId }));
      setMessages(session.messages);
    }
  };

  const handleSessionDelete = (sessionId: string) => {
    ChatStorage.deleteSession(sessionId);
    const updatedHistory = ChatStorage.loadHistory();
    setChatHistory(updatedHistory);
    
    if (sessionId === chatHistory.currentSessionId) {
      if (updatedHistory.sessions.length > 0) {
        handleSessionSelect(updatedHistory.sessions[0].id);
      } else {
        setMessages([]);
      }
    }
  };

  const handleSessionRename = (sessionId: string, newTitle: string) => {
    ChatStorage.updateSessionTitle(sessionId, newTitle);
    const updatedHistory = ChatStorage.loadHistory();
    setChatHistory(updatedHistory);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Create new session if none exists
    let currentSessionId = chatHistory.currentSessionId;
    if (!currentSessionId) {
      const newSession = ChatStorage.createNewSession();
      setChatHistory(prev => ({
        sessions: [...prev.sessions, newSession],
        currentSessionId: newSession.id
      }));
      currentSessionId = newSession.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    ChatStorage.addMessageToSession(currentSessionId, userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputText.trim(),
          chatHistory: messages // Send chat history for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      const decoder = new TextDecoder();
      let done = false;
      let aiMessageContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                done = true;
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  aiMessageContent += parsed.content;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessage.id 
                        ? { ...msg, content: msg.content + parsed.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Save AI message to session after streaming is complete
      const finalAiMessage = { ...aiMessage, content: aiMessageContent };
      ChatStorage.addMessageToSession(currentSessionId, finalAiMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      if (currentSessionId) {
        ChatStorage.addMessageToSession(currentSessionId, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearAllHistory = () => {
    ChatStorage.clearAllHistory();
    setChatHistory({ sessions: [], currentSessionId: null });
    setMessages([]);
  };

  const extractTextFromChildren = (children: any): string => {
    if (typeof children === 'string') {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map(extractTextFromChildren).join('');
    }
    if (children && typeof children === 'object' && children.props) {
      return extractTextFromChildren(children.props.children);
    }
    return '';
  };

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodeId(codeId);
      setTimeout(() => setCopiedCodeId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCodeId(codeId);
        setTimeout(() => setCopiedCodeId(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          sessions={chatHistory.sessions}
          currentSessionId={chatHistory.currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onSessionDelete={handleSessionDelete}
          onSessionRename={handleSessionRename}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Card className="rounded-none border-x-0 border-t-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="p-2 bg-primary rounded-lg">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    Gemini 2.0 Flash
                  </h1>
                  <p className="text-sm text-muted-foreground">AI Chat Assistant</p>
                </div>
              </div>
              {chatHistory.sessions.length > 0 && (
                <Button
                  onClick={clearAllHistory}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-6 bg-primary rounded-full mb-6">
                <Bot className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-primary">
                Welcome to Gemini 2.0 Flash Chat
              </h2>
              <p className="text-muted-foreground mb-4 max-w-md">
                Start a conversation by typing a message below. Your chat history will be saved automatically.
              </p>
              <Badge variant="secondary" className="text-xs">
                Powered by Google Gemini 2.0 Flash
              </Badge>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <Card className={`max-w-[80%] ${message.isUser ? 'bg-primary text-primary-foreground' : ''}`}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      {message.isUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">You</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-primary">Gemini</span>
                          <Badge variant="outline" className="text-xs">
                            AI Assistant
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <Separator className={message.isUser ? 'bg-primary-foreground/20' : ''} />
                    
                    <div className="text-sm">
                      {message.isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                            // Custom styling for markdown elements
                            code: ({ node, inline, className, children, ...props }) => {
                              if (inline) {
                                return (
                                  <code
                                    className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              }
                              
                              // Generate unique ID for each code block
                              const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                              const codeText = extractTextFromChildren(children).replace(/\n$/, '');
                              
                              return (
                                <div className="relative group">
                                  <code
                                    className={`${className} block bg-muted p-3 pr-12 rounded-lg text-sm font-mono overflow-x-auto border`}
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                  <Button
                                    onClick={() => copyToClipboard(codeText, codeId)}
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy code"
                                  >
                                    {copiedCodeId === codeId ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto border">
                                {children}
                              </pre>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside space-y-1 my-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside space-y-1 my-2">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm">{children}</li>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm mb-2 last:mb-0">{children}</p>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold mb-2">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold mb-2">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-bold mb-1">{children}</h3>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary pl-3 italic my-2 bg-primary/10 p-2 rounded-r">
                                {children}
                              </blockquote>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                          }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {message.isUser && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Gemini is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <Card className="rounded-none border-x-0 border-b-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none min-h-[60px] max-h-[120px]"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
