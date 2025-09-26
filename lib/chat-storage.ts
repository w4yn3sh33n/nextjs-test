import { ChatHistory, ChatSession, Message } from './types';

const CHAT_HISTORY_KEY = 'gemini-chat-history';

export class ChatStorage {
  static loadHistory(): ChatHistory {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      if (!stored) {
        return { sessions: [], currentSessionId: null };
      }
      
      const parsed = JSON.parse(stored);
      return {
        sessions: parsed.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })),
        currentSessionId: parsed.currentSessionId
      };
    } catch (error) {
      console.error('Error loading chat history:', error);
      return { sessions: [], currentSessionId: null };
    }
  }

  static saveHistory(history: ChatHistory): void {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  static createNewSession(): ChatSession {
    const now = new Date();
    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      summary: '',
      messages: [],
      createdAt: now,
      updatedAt: now
    };
  }

  static generateSummary(messages: Message[]): string {
    if (messages.length === 0) return '';
    
    // 첫 번째 사용자 메시지의 첫 50자를 요약으로 사용
    const firstUserMessage = messages.find(msg => msg.isUser);
    if (firstUserMessage) {
      return firstUserMessage.content.length > 50 
        ? firstUserMessage.content.substring(0, 50) + '...'
        : firstUserMessage.content;
    }
    
    return 'Empty chat';
  }

  static updateSessionTitle(sessionId: string, title: string): void {
    const history = this.loadHistory();
    const session = history.sessions.find(s => s.id === sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date();
      this.saveHistory(history);
    }
  }

  static updateSessionSummary(sessionId: string, summary: string): void {
    const history = this.loadHistory();
    const session = history.sessions.find(s => s.id === sessionId);
    if (session) {
      session.summary = summary;
      session.updatedAt = new Date();
      this.saveHistory(history);
    }
  }

  static addMessageToSession(sessionId: string, message: Message): void {
    const history = this.loadHistory();
    const session = history.sessions.find(s => s.id === sessionId);
    if (session) {
      session.messages.push(message);
      session.updatedAt = new Date();
      
      // 첫 번째 메시지가 추가되면 제목과 요약 생성
      if (session.messages.length === 1) {
        session.title = this.generateSummary(session.messages);
        session.summary = session.title;
      }
      
      this.saveHistory(history);
    }
  }

  static deleteSession(sessionId: string): void {
    const history = this.loadHistory();
    history.sessions = history.sessions.filter(s => s.id !== sessionId);
    
    // 현재 세션이 삭제된 경우 첫 번째 세션으로 변경
    if (history.currentSessionId === sessionId) {
      history.currentSessionId = history.sessions.length > 0 ? history.sessions[0].id : null;
    }
    
    this.saveHistory(history);
  }

  static clearAllHistory(): void {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }
}
