import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Ticket, MessageCircle, User, Clock, AlertTriangle, CheckCircle, Send, Paperclip, Phone, Star, Filter, Search, MoreHorizontal, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'sales' | 'warranty' | 'delivery' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedAgent?: string;
  responses: SupportResponse[];
  createdAt: number;
  updatedAt: number;
  customerSatisfaction?: number;
}

interface SupportResponse {
  id: string;
  authorType: 'user' | 'admin' | 'system';
  authorName: string;
  message: string;
  timestamp: number;
  isInternal: boolean;
}

interface ChatSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'active' | 'waiting' | 'closed' | 'transferred';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'bot';
  message: string;
  timestamp: number;
  isRead: boolean;
}

export default function SupportManagementDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [chatFilter, setChatFilter] = useState('active');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/tickets');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch chat sessions
  const { data: chatSessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/chat-sessions');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<SupportTicket> }) => {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update ticket');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({ title: 'Success', description: 'Ticket updated successfully' });
    }
  });

  const addResponseMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const response = await fetch(`/api/support/tickets/${ticketId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, authorType: 'admin', authorName: 'Support Agent' })
      });
      if (!response.ok) throw new Error('Failed to add response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setNewResponse('');
      toast({ title: 'Success', description: 'Response sent successfully' });
    }
  });

  const sendChatMessageMutation = useMutation({
    mutationFn: async ({ chatId, message }: { chatId: string; message: string }) => {
      const response = await fetch(`/api/support/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, senderType: 'admin' })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      setNewChatMessage('');
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'waiting_customer': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (ticketFilter === 'all') return true;
    return ticket.status === ticketFilter;
  });

  const filteredChats = chatSessions.filter(chat => {
    if (chatFilter === 'all') return true;
    return chat.status === chatFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Management</h2>
          <p className="text-gray-600">Manage support tickets and live chat sessions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {tickets.filter(t => t.status === 'open').length} Open Tickets
          </Badge>
          <Badge variant="outline">
            {chatSessions.filter(c => c.status === 'active').length} Active Chats
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold">{chatSessions.filter(c => c.status === 'active').length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">2.4h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold">4.7/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {filteredTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className={`cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getPriorityColor(ticket.priority)} text-white text-xs`}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(ticket.status)} text-white text-xs`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(ticket.createdAt))} ago
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{ticket.subject}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{ticket.userName}</span>
                      <span>{ticket.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTicket && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {selectedTicket.userName} ({selectedTicket.userEmail})
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={selectedTicket.status} 
                          onValueChange={(value) => updateTicketMutation.mutate({ 
                            ticketId: selectedTicket.id, 
                            updates: { status: value as any }
                          })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Original ticket description */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{selectedTicket.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(selectedTicket.createdAt))} ago
                      </p>
                    </div>

                    {/* Responses */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTicket.responses.map((response) => (
                        <div key={response.id} className={`p-3 rounded-lg ${
                          response.authorType === 'admin' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{response.authorName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(response.timestamp))} ago
                            </span>
                          </div>
                          <p className="text-sm">{response.message}</p>
                        </div>
                      ))}
                    </div>

                    {/* Response input */}
                    <div className="space-y-3 pt-3 border-t">
                      <Textarea
                        placeholder="Type your response..."
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        className="min-h-20"
                      />
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach File
                        </Button>
                        <Button 
                          onClick={() => addResponseMutation.mutate({ 
                            ticketId: selectedTicket.id, 
                            message: newResponse 
                          })}
                          disabled={!newResponse.trim() || addResponseMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Response
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={chatFilter} onValueChange={setChatFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chats</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {filteredChats.map((chat) => (
                <Card 
                  key={chat.id} 
                  className={`cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${chat.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs`}>
                        {chat.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(chat.lastActivity))} ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{chat.userName}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {chat.messages[chat.messages.length - 1]?.message || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>{chat.messages.length} messages</span>
                      <span>{chat.assignedAgent || 'Unassigned'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedChat && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Chat with {selectedChat.userName}</CardTitle>
                        <p className="text-sm text-gray-600">{selectedChat.userEmail}</p>
                      </div>
                      <Badge className={`${selectedChat.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                        {selectedChat.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Chat messages */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {selectedChat.messages.map((message) => (
                        <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-3 rounded-lg ${
                            message.senderType === 'admin' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderType === 'admin' ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatDistanceToNow(new Date(message.timestamp))} ago
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message input */}
                    <div className="flex items-center space-x-2 pt-3 border-t">
                      <Input
                        placeholder="Type your message..."
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newChatMessage.trim()) {
                            sendChatMessageMutation.mutate({
                              chatId: selectedChat.id,
                              message: newChatMessage
                            });
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => sendChatMessageMutation.mutate({
                          chatId: selectedChat.id,
                          message: newChatMessage
                        })}
                        disabled={!newChatMessage.trim() || sendChatMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}