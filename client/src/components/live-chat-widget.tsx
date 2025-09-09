import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, MinusCircle, Bot, User, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { liveChatService } from '@/services/live-chat-service';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'bot';
  message: string;
  timestamp: number;
  isRead: boolean;
}

interface ChatWidgetProps {
  initiallyVisible?: boolean;
}

export default function LiveChatWidget({ initiallyVisible = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initiallyVisible);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear any cached data and initialize chat session when widget opens
  useEffect(() => {
    if (isOpen && user && !sessionId) {
      // Clear any existing messages before starting new session
      setMessages([]);
      setForceUpdate(prev => prev + 1);
      initializeChatSession();
    }
  }, [isOpen, user]);

  // Listen for agent typing events
  useEffect(() => {
    const handleAgentTyping = (event: CustomEvent) => {
      if (event.detail.sessionId === sessionId) {
        setAgentTyping(event.detail.isTyping);
      }
    };

    window.addEventListener('agentTyping', handleAgentTyping as EventListener);
    return () => window.removeEventListener('agentTyping', handleAgentTyping as EventListener);
  }, [sessionId]);

  // Listen for new chat messages (including AI responses)
  useEffect(() => {
    if (!sessionId) return;
    
    const handleNewMessage = (event: CustomEvent) => {
      if (event.detail.sessionId === sessionId) {
        // Reload messages from session to get the latest AI response
        const session = liveChatService.getChatSession(sessionId);
        if (session) {
          setMessages([...session.messages]);
          setForceUpdate(prev => prev + 1);
          
          // Show notification if chat is minimized
          if (isMinimized && event.detail.message.senderType !== 'user') {
            setHasUnreadMessages(true);
          }
        }
      }
    };

    window.addEventListener('newChatMessage', handleNewMessage as EventListener);
    return () => window.removeEventListener('newChatMessage', handleNewMessage as EventListener);
  }, [sessionId, isMinimized]);

  const initializeChatSession = async () => {
    if (!user) return;

    try {
      // Force clear messages before initializing new session
      setMessages([]);
      
      const newSessionId = await liveChatService.startChatSession(
        user.uid,
        user.email || '',
        user.displayName || 'User',
        'Hello! I need help with my PC build.'
      );
      
      setSessionId(newSessionId);
      setIsConnected(true);

      // Load initial messages (these will have new IDs)
      const session = liveChatService.getChatSession(newSessionId);
      if (session) {
        setMessages([...session.messages]); // Force new array reference
        setForceUpdate(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || !user) return;

    try {
      await liveChatService.sendMessage(
        sessionId,
        user.uid,
        currentMessage.trim(),
        'user'
      );

      // Reload messages from session instead of manually adding to prevent duplicates
      const session = liveChatService.getChatSession(sessionId);
      if (session) {
        setMessages([...session.messages]); // Create a new array to force re-render
        setForceUpdate(prev => prev + 1); // Force React to re-render with new keys
      }
      
      setCurrentMessage('');

      // Show typing indicator briefly
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnreadMessages(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const restoreChat = () => {
    setIsMinimized(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          data-testid="chat-toggle-button"
        >
          <MessageCircle className="h-6 w-6" />
          {hasUnreadMessages && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 text-white text-xs">
              !
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-lg shadow-xl border-2 border-blue-200 p-4 w-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Headphones className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Live Support</span>
              {isConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              )}
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={restoreChat} data-testid="chat-restore-button">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleChat} data-testid="chat-close-button">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {hasUnreadMessages && (
            <p className="text-sm text-blue-600 mt-2">New messages available</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Headphones className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">FusionForge AI Assistant</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs opacity-90">AI Powered</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={minimizeChat} className="text-white hover:bg-white/20" data-testid="chat-minimize-button">
                <MinusCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleChat} className="text-white hover:bg-white/20" data-testid="chat-close-button">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p className="text-sm">Welcome to FusionForge AI Assistant!</p>
              <p className="text-xs text-gray-400 mt-1">I can help with PC builds, components, pricing, and technical support. Ask me anything!</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end space-x-2 max-w-[80%]">
                {message.senderType !== 'user' && (
                  <div className="flex-shrink-0">
                    {message.senderType === 'bot' ? (
                      <Bot className="h-6 w-6 text-blue-500" />
                    ) : (
                      <Headphones className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                )}
                
                <div className={`rounded-lg px-3 py-2 ${
                  message.senderType === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.senderType === 'bot'
                    ? 'bg-blue-100 text-gray-800'
                    : 'bg-green-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderType === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {message.senderType === 'user' && (
                  <User className="h-6 w-6 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}

          {(isTyping || agentTyping) && (
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-lg px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          {!user ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Please log in to start a chat session</p>
              <Button size="sm" onClick={() => window.location.href = '/login'} data-testid="chat-login-button">
                Login to Chat
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1"
                disabled={!isConnected}
                data-testid="chat-message-input"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!currentMessage.trim() || !isConnected}
                size="sm"
                data-testid="chat-send-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}