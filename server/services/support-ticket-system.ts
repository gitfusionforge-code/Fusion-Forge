import { firebaseRealtimeStorage as storage } from '../firebase-realtime-storage';
import { sendEmail } from '../email-service';

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
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: number;
  }>;
  responses: SupportResponse[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  customerSatisfaction?: number;
  internalNotes?: string;
}

interface SupportResponse {
  id: string;
  authorId: string;
  authorType: 'user' | 'admin' | 'system';
  authorName: string;
  message: string;
  timestamp: number;
  isInternal: boolean;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
  }>;
}

interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  agentPerformance: Array<{
    agentId: string;
    ticketsHandled: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
  }>;
}

class SupportTicketSystem {
  private tickets = new Map<string, SupportTicket>();
  private emailTemplates = new Map<string, string>();

  constructor() {
    this.initializeEmailTemplates();
    this.loadExistingTickets();
  }

  // Initialize email templates for different ticket events
  private initializeEmailTemplates() {
    this.emailTemplates.set('ticket_created', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Support Ticket Created</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">FusionForge PCs Support</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">Dear {{userName}},</h2>
          <p>Thank you for contacting FusionForge PCs support. We have received your request and assigned it ticket number <strong>{{ticketId}}</strong>.</p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">Ticket Details</h3>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
            <p><strong>Status:</strong> {{status}}</p>
          </div>
          
          <p>Our support team will respond within:</p>
          <ul>
            <li><strong>Urgent:</strong> 1 hour</li>
            <li><strong>High:</strong> 4 hours</li>
            <li><strong>Medium:</strong> 24 hours</li>
            <li><strong>Low:</strong> 48 hours</li>
          </ul>
          
          <p>You can track your ticket status by visiting your dashboard or replying to this email.</p>
        </div>
      </div>
    `);

    this.emailTemplates.set('ticket_response', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Support Response</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ticket #{{ticketId}}</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">Hi {{userName}},</h2>
          <p>{{agentName}} from our support team has responded to your ticket:</p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #28a745;">Support Response</h3>
            <p style="line-height: 1.6;">{{responseMessage}}</p>
          </div>
          
          <p>If this resolves your issue, please let us know by marking the ticket as resolved. If you need further assistance, simply reply to this email.</p>
        </div>
      </div>
    `);

    this.emailTemplates.set('ticket_resolved', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">✅ Ticket Resolved</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ticket #{{ticketId}}</p>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">Hi {{userName}},</h2>
          <p>Great news! Your support ticket has been marked as resolved.</p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #28a745;">Ticket Summary</h3>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Resolution Time:</strong> {{resolutionTime}}</p>
            <p><strong>Final Status:</strong> Resolved</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>How was our support?</p>
            <a href="{{feedbackUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Rate Our Service</a>
          </div>
        </div>
      </div>
    `);
  }

  // Create new support ticket
  async createTicket(ticketData: {
    userId: string;
    userEmail: string;
    userName: string;
    subject: string;
    description: string;
    category: SupportTicket['category'];
    priority?: SupportTicket['priority'];
    attachments?: SupportTicket['attachments'];
  }): Promise<SupportTicket> {
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const ticket: SupportTicket = {
      id: ticketId,
      userId: ticketData.userId,
      userEmail: ticketData.userEmail,
      userName: ticketData.userName,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category,
      priority: ticketData.priority || this.calculatePriority(ticketData.category, ticketData.description),
      status: 'open',
      attachments: ticketData.attachments || [],
      responses: [],
      tags: this.generateTags(ticketData.subject, ticketData.description),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tickets.set(ticketId, ticket);
    
    // Persist to Firebase
    await this.persistTicket(ticket);

    // Send confirmation email
    await this.sendTicketEmail('ticket_created', ticket);

    // Auto-assign based on category
    await this.autoAssignTicket(ticketId);

    return ticket;
  }

  // Add response to ticket
  async addResponse(ticketId: string, response: {
    authorId: string;
    authorType: 'user' | 'admin';
    authorName: string;
    message: string;
    isInternal?: boolean;
    attachments?: SupportResponse['attachments'];
  }): Promise<SupportResponse> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const supportResponse: SupportResponse = {
      id: `resp_${Date.now()}`,
      authorId: response.authorId,
      authorType: response.authorType,
      authorName: response.authorName,
      message: response.message,
      timestamp: Date.now(),
      isInternal: response.isInternal || false,
      attachments: response.attachments
    };

    ticket.responses.push(supportResponse);
    ticket.updatedAt = Date.now();

    // Update status if customer responded
    if (response.authorType === 'user' && ticket.status === 'waiting_customer') {
      ticket.status = 'in_progress';
    }

    await this.persistTicket(ticket);

    // Send email notification for non-internal responses
    if (!supportResponse.isInternal) {
      await this.sendTicketEmail('ticket_response', ticket, supportResponse);
    }

    return supportResponse;
  }

  // Resolve ticket
  async resolveTicket(ticketId: string, resolutionMessage: string, agentId: string): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    // Add resolution response
    await this.addResponse(ticketId, {
      authorId: agentId,
      authorType: 'admin',
      authorName: 'Support Team',
      message: resolutionMessage,
      isInternal: false
    });

    ticket.status = 'resolved';
    ticket.resolvedAt = Date.now();
    ticket.updatedAt = Date.now();

    await this.persistTicket(ticket);
    await this.sendTicketEmail('ticket_resolved', ticket);
  }

  // Calculate priority based on category and content
  private calculatePriority(category: string, description: string): SupportTicket['priority'] {
    const urgentKeywords = ['urgent', 'critical', 'broken', 'not working', 'emergency'];
    const highKeywords = ['important', 'asap', 'soon', 'problem', 'issue'];
    
    const lowerDescription = description.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'urgent';
    }
    
    if (category === 'technical' || category === 'billing') {
      return 'high';
    }
    
    if (highKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'high';
    }
    
    return 'medium';
  }

  // Generate relevant tags for ticket
  private generateTags(subject: string, description: string): string[] {
    const content = `${subject} ${description}`.toLowerCase();
    const tags: string[] = [];

    // Technical tags
    if (content.includes('compatibility')) tags.push('compatibility');
    if (content.includes('performance')) tags.push('performance');
    if (content.includes('installation')) tags.push('installation');
    if (content.includes('driver')) tags.push('drivers');
    if (content.includes('bios')) tags.push('bios');

    // Product tags
    if (content.includes('gpu') || content.includes('graphics')) tags.push('gpu');
    if (content.includes('cpu') || content.includes('processor')) tags.push('cpu');
    if (content.includes('ram') || content.includes('memory')) tags.push('ram');
    if (content.includes('ssd') || content.includes('storage')) tags.push('storage');

    // Issue type tags
    if (content.includes('delivery') || content.includes('shipping')) tags.push('delivery');
    if (content.includes('payment') || content.includes('refund')) tags.push('payment');
    if (content.includes('warranty') || content.includes('defect')) tags.push('warranty');

    return tags;
  }

  // Auto-assign ticket to appropriate agent
  private async autoAssignTicket(ticketId: string): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return;

    // Simple assignment logic (in production, would be more sophisticated)
    const agentAssignments = {
      'technical': 'agent_tech_001',
      'billing': 'agent_billing_001', 
      'sales': 'agent_sales_001',
      'warranty': 'agent_tech_002',
      'delivery': 'agent_support_001',
      'general': 'agent_support_002'
    };

    ticket.assignedAgent = agentAssignments[ticket.category] || 'agent_support_001';
    ticket.status = 'in_progress';
    
    await this.persistTicket(ticket);
  }

  // Send ticket-related emails
  private async sendTicketEmail(templateType: string, ticket: SupportTicket, response?: SupportResponse): Promise<void> {
    try {
      const template = this.emailTemplates.get(templateType);
      if (!template) return;

      let emailContent = template
        .replace(/{{ticketId}}/g, ticket.id)
        .replace(/{{userName}}/g, ticket.userName)
        .replace(/{{subject}}/g, ticket.subject)
        .replace(/{{category}}/g, ticket.category)
        .replace(/{{priority}}/g, ticket.priority)
        .replace(/{{status}}/g, ticket.status);

      if (response) {
        emailContent = emailContent
          .replace(/{{agentName}}/g, response.authorName)
          .replace(/{{responseMessage}}/g, response.message);
      }

      if (ticket.resolvedAt) {
        const resolutionTime = Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60)); // hours
        emailContent = emailContent.replace(/{{resolutionTime}}/g, `${resolutionTime} hours`);
      }

      const feedbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/feedback/${ticket.id}`;
      emailContent = emailContent.replace(/{{feedbackUrl}}/g, feedbackUrl);

      await sendEmail({
        to: ticket.userEmail,
        from: 'support@fusionforgepc.com',
        subject: `[${ticket.id}] ${ticket.subject}`,
        html: emailContent
      });

    } catch (error) {
      console.error('Error sending ticket email:', error);
    }
  }

  // Get ticket analytics
  async getTicketAnalytics(): Promise<TicketAnalytics> {
    const allTickets = Array.from(this.tickets.values());
    const openTickets = allTickets.filter(t => ['open', 'in_progress', 'waiting_customer'].includes(t.status));
    
    // Calculate average response time
    const responseTimes = allTickets
      .filter(t => t.responses.length > 0)
      .map(t => t.responses[0].timestamp - t.createdAt);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate average resolution time
    const resolvedTickets = allTickets.filter(t => t.resolvedAt);
    const resolutionTimes = resolvedTickets.map(t => t.resolvedAt! - t.createdAt);
    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    // Calculate customer satisfaction
    const satisfactionScores = allTickets
      .filter(t => t.customerSatisfaction)
      .map(t => t.customerSatisfaction!);
    const averageSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    // Group by category and priority
    const ticketsByCategory = allTickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ticketsByPriority = allTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agent performance (simplified)
    const agentPerformance = this.calculateAgentPerformance(allTickets);

    return {
      totalTickets: allTickets.length,
      openTickets: openTickets.length,
      averageResponseTime: Math.round(averageResponseTime / (1000 * 60 * 60)), // Convert to hours
      averageResolutionTime: Math.round(averageResolutionTime / (1000 * 60 * 60)), // Convert to hours
      customerSatisfactionScore: Math.round(averageSatisfaction * 10) / 10,
      ticketsByCategory,
      ticketsByPriority,
      agentPerformance
    };
  }

  // Calculate agent performance metrics
  private calculateAgentPerformance(tickets: SupportTicket[]): Array<{
    agentId: string;
    ticketsHandled: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
  }> {
    const agentMetrics = new Map<string, {
      tickets: SupportTicket[];
      totalResolutionTime: number;
      satisfactionScores: number[];
    }>();

    tickets.forEach(ticket => {
      if (ticket.assignedAgent) {
        if (!agentMetrics.has(ticket.assignedAgent)) {
          agentMetrics.set(ticket.assignedAgent, {
            tickets: [],
            totalResolutionTime: 0,
            satisfactionScores: []
          });
        }

        const agentData = agentMetrics.get(ticket.assignedAgent)!;
        agentData.tickets.push(ticket);

        if (ticket.resolvedAt) {
          agentData.totalResolutionTime += ticket.resolvedAt - ticket.createdAt;
        }

        if (ticket.customerSatisfaction) {
          agentData.satisfactionScores.push(ticket.customerSatisfaction);
        }
      }
    });

    return Array.from(agentMetrics.entries()).map(([agentId, data]) => ({
      agentId,
      ticketsHandled: data.tickets.length,
      averageResolutionTime: data.tickets.filter(t => t.resolvedAt).length > 0
        ? Math.round(data.totalResolutionTime / data.tickets.filter(t => t.resolvedAt).length / (1000 * 60 * 60))
        : 0,
      customerSatisfaction: data.satisfactionScores.length > 0
        ? Math.round((data.satisfactionScores.reduce((sum, score) => sum + score, 0) / data.satisfactionScores.length) * 10) / 10
        : 0
    }));
  }

  // Get all tickets with filtering
  getTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    assignedAgent?: string;
    userId?: string;
  }): SupportTicket[] {
    let tickets = Array.from(this.tickets.values());

    if (filters) {
      if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
      if (filters.category) tickets = tickets.filter(t => t.category === filters.category);
      if (filters.priority) tickets = tickets.filter(t => t.priority === filters.priority);
      if (filters.assignedAgent) tickets = tickets.filter(t => t.assignedAgent === filters.assignedAgent);
      if (filters.userId) tickets = tickets.filter(t => t.userId === filters.userId);
    }

    return tickets.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Persist ticket to storage
  private async persistTicket(ticket: SupportTicket): Promise<void> {
    try {
      // In production, save to Firebase
      localStorage.setItem(`support_ticket_${ticket.id}`, JSON.stringify(ticket));
    } catch (error) {
      console.error('Error persisting ticket:', error);
    }
  }

  // Load existing tickets
  private async loadExistingTickets(): Promise<void> {
    try {
      // In production, load from Firebase
      // For now, use localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('support_ticket_')) {
          const ticketData = localStorage.getItem(key);
          if (ticketData) {
            const ticket = JSON.parse(ticketData);
            this.tickets.set(ticket.id, ticket);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  }
}

export const supportTicketSystem = new SupportTicketSystem();