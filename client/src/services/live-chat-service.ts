// Live Chat Integration Service
import { firebaseRealtimeStorage as storage } from '../../../server/firebase-realtime-storage';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'bot';
  message: string;
  timestamp: number;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
  }>;
  isRead: boolean;
  metadata?: Record<string, any>;
}

interface ChatSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'active' | 'waiting' | 'closed' | 'transferred';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'sales' | 'support' | 'billing' | 'general';
  assignedAgent?: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
  tags: string[];
  customerSatisfaction?: number;
}

interface AutoResponse {
  triggers: string[];
  response: string;
  escalate: boolean;
  category: string;
}

class LiveChatService {
  private activeSessions = new Map<string, ChatSession>();
  private autoResponses: AutoResponse[] = [];
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageCounter = 0;

  constructor() {
    this.initializeAutoResponses();
    // Clear any existing sessions with old message IDs to prevent duplicate key warnings
    this.activeSessions.clear();
    this.clearOldChatSessions();
    // WebSocket server not implemented yet - disabling to prevent console errors
    // this.initializeWebSocket();
  }

  // Clear old chat sessions from localStorage to prevent duplicate key warnings
  private clearOldChatSessions() {
    try {
      // Remove all chat session data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat_session_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Silently handle localStorage errors
    }
  }

  // Initialize AI-powered auto responses
  private initializeAutoResponses() {
    this.autoResponses = [
      {
        triggers: ['price', 'cost', 'expensive', 'cheap', 'budget'],
        response: 'I understand you have questions about pricing. Our PC builds start from ₹15,000 and go up to ₹1,50,000 depending on your performance needs. Would you like me to recommend builds within your budget range?',
        escalate: false,
        category: 'sales'
      },
      {
        triggers: ['compatibility', 'compatible', 'work together', 'upgrade'],
        response: 'Great question about compatibility! Our PC configurator automatically checks component compatibility and alerts you to any issues. I can help you verify specific component combinations. What components are you considering?',
        escalate: false,
        category: 'technical'
      },
      {
        triggers: ['delivery', 'shipping', 'when will', 'timeline'],
        response: 'For delivery timelines, most PC builds are assembled and shipped within 3-5 business days. Custom configurations may take 5-7 days. I can check specific availability for the build you\'re interested in.',
        escalate: false,
        category: 'support'
      },
      {
        triggers: ['warranty', 'guarantee', 'return', 'defect'],
        response: 'All our PC builds come with comprehensive warranty coverage. Components have manufacturer warranties (1-3 years) and we provide assembly warranty for 1 year. Would you like details about warranty coverage for a specific build?',
        escalate: true,
        category: 'support'
      },
      {
        triggers: ['custom', 'modify', 'change component', 'different'],
        response: 'Absolutely! We specialize in custom PC builds. You can use our configurator to modify any build, or I can help you create a completely custom configuration. What\'s your intended use case and budget?',
        escalate: false,
        category: 'sales'
      },
      {
        triggers: ['payment', 'razorpay', 'card', 'emi', 'installment'],
        response: 'We accept payments via UPI, Net Banking, Credit/Debit Cards, and EMI options through Razorpay. EMI is available for orders above ₹10,000. Would you like to know about EMI options for a specific build?',
        escalate: false,
        category: 'billing'
      },
      {
        triggers: ['gaming', 'fps', 'performance', 'rtx', 'graphics'],
        response: 'For gaming performance, I can help you choose the right GPU and CPU combination. Our builds show estimated FPS for different games and resolutions. What games do you plan to play and at what resolution?',
        escalate: false,
        category: 'technical'
      },
      {
        triggers: ['help', 'support', 'problem', 'issue', 'not working'],
        response: 'I\'m here to help! Please describe the specific issue you\'re experiencing and I\'ll do my best to assist you. For complex technical issues, I can connect you with our technical team.',
        escalate: true,
        category: 'support'
      }
    ];
  }

  // Initialize WebSocket connection for real-time chat
  private initializeWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
      
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Live chat WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Live chat WebSocket disconnected');
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Attempt to reconnect WebSocket
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'new_message':
        this.addMessageToSession(data.sessionId, data.message);
        break;
      case 'session_update':
        this.updateSessionStatus(data.sessionId, data.status);
        break;
      case 'agent_typing':
        this.handleAgentTyping(data.sessionId, data.isTyping);
        break;
    }
  }

  // Start new chat session
  async startChatSession(userId: string, userEmail: string, userName: string, initialMessage?: string): Promise<string> {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      userEmail,
      userName,
      status: 'active',
      priority: 'medium',
      category: 'general',
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      tags: []
    };

    // Add initial message if provided
    if (initialMessage) {
      const message: ChatMessage = {
        id: `msg_${Date.now()}_${++this.messageCounter}`,
        senderId: userId,
        senderType: 'user',
        message: initialMessage,
        timestamp: Date.now(),
        isRead: false
      };
      session.messages.push(message);

      // Check for auto-response
      const autoResponse = this.getAutoResponse(initialMessage);
      if (autoResponse) {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_${++this.messageCounter}`,
          senderId: 'bot',
          senderType: 'bot',
          message: autoResponse.response,
          timestamp: Date.now() + 1000,
          isRead: false,
          metadata: { 
            autoGenerated: true, 
            category: autoResponse.category,
            needsEscalation: autoResponse.escalate
          }
        };
        session.messages.push(botMessage);

        if (autoResponse.escalate) {
          session.priority = 'high';
          session.status = 'waiting';
        }
      }
    }

    this.activeSessions.set(sessionId, session);
    
    // Persist to Firebase
    await this.persistSession(session);

    return sessionId;
  }

  // Send message in chat session
  async sendMessage(sessionId: string, senderId: string, message: string, senderType: 'user' | 'admin' = 'user'): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Chat session not found');

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId,
      senderType,
      message,
      timestamp: Date.now(),
      isRead: false
    };

    session.messages.push(chatMessage);
    session.lastActivity = Date.now();

    // Auto-response for user messages
    if (senderType === 'user') {
      const autoResponse = this.getAutoResponse(message);
      if (autoResponse) {
        setTimeout(async () => {
          const botMessage: ChatMessage = {
            id: `msg_${Date.now()}_${++this.messageCounter}`,
            senderId: 'bot',
            senderType: 'bot',
            message: autoResponse.response,
            timestamp: Date.now(),
            isRead: false,
            metadata: { 
              autoGenerated: true, 
              category: autoResponse.category,
              needsEscalation: autoResponse.escalate
            }
          };
          session.messages.push(botMessage);
          
          if (autoResponse.escalate) {
            session.priority = 'high';
            session.status = 'waiting';
          }

          await this.persistSession(session);
          this.broadcastMessage(sessionId, botMessage);
        }, 1500); // 1.5 second delay for natural feel
      }
    }

    // Persist updated session
    await this.persistSession(session);

    // Broadcast via WebSocket
    this.broadcastMessage(sessionId, chatMessage);

    return chatMessage;
  }

  // Get auto-response based on message content
  private getAutoResponse(message: string): AutoResponse | null {
    const lowerMessage = message.toLowerCase();
    
    for (const response of this.autoResponses) {
      if (response.triggers.some(trigger => lowerMessage.includes(trigger))) {
        return response;
      }
    }

    return null;
  }

  // Broadcast message via WebSocket
  private broadcastMessage(sessionId: string, message: ChatMessage) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'new_message',
        sessionId,
        message
      }));
    }
  }

  // Persist session to Firebase
  private async persistSession(session: ChatSession) {
    try {
      // In a real implementation, this would save to Firebase
      localStorage.setItem(`chat_session_${session.id}`, JSON.stringify(session));
    } catch (error) {
      console.error('Error persisting chat session:', error);
    }
  }

  // Get chat session
  getChatSession(sessionId: string): ChatSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  // Add message to existing session
  private addMessageToSession(sessionId: string, message: ChatMessage) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      session.lastActivity = Date.now();
    }
  }

  // Update session status
  private updateSessionStatus(sessionId: string, status: ChatSession['status']) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = status;
      session.lastActivity = Date.now();
    }
  }

  // Handle agent typing indicator
  private handleAgentTyping(sessionId: string, isTyping: boolean) {
    // Update UI to show typing indicator
    const event = new CustomEvent('agentTyping', {
      detail: { sessionId, isTyping }
    });
    window.dispatchEvent(event);
  }

  // End chat session
  async endChatSession(sessionId: string, satisfaction?: number): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      session.customerSatisfaction = satisfaction;
      session.lastActivity = Date.now();
      
      await this.persistSession(session);
      this.activeSessions.delete(sessionId);
    }
  }
}

export const liveChatService = new LiveChatService();