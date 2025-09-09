import { firebaseRealtimeStorage } from '../firebase-realtime-storage';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface EscalationDecision {
  shouldEscalate: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export class GeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private conversationHistory = new Map<string, ChatMessage[]>();

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  // Get AI response for customer inquiry
  async getAIResponse(sessionId: string, userMessage: string): Promise<{
    response: string;
    escalation: EscalationDecision;
  }> {
    try {
      // Get conversation history for context
      const history = this.conversationHistory.get(sessionId) || [];
      
      // Get PC builds data for context
      const pcBuilds = await firebaseRealtimeStorage.getPcBuilds();
      
      // Create context-aware prompt
      const systemPrompt = this.createSystemPrompt(pcBuilds);
      
      // Build conversation history
      const messages: ChatMessage[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const response = await this.callGeminiAPI(messages);
      
      // Update conversation history
      history.push(
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: response }] }
      );
      this.conversationHistory.set(sessionId, history);

      // Determine if escalation is needed
      const escalation = await this.determineEscalation(userMessage, response);

      return { response, escalation };
    } catch (error) {
      console.error('Gemini AI Service error:', error);
      
      // Return fallback response with escalation
      return {
        response: "I'm experiencing technical difficulties right now. Let me connect you with our support team who can assist you immediately.",
        escalation: {
          shouldEscalate: true,
          reason: 'AI service unavailable',
          urgency: 'medium'
        }
      };
    }
  }

  // Create comprehensive system prompt with PC building knowledge
  private createSystemPrompt(pcBuilds: any[]): string {
    const buildsContext = pcBuilds.map(build => 
      `${build.name}: ₹${build.basePrice?.toLocaleString() || 'N/A'} - ${build.description || 'Custom PC build'}`
    ).join('\n');

    return `You are FusionForge AI Assistant, an expert in custom PC building and computer hardware. You work for FusionForge PCs, a premium PC building company in India.

COMPANY CONTEXT:
- We specialize in gaming PCs, workstations, and budget builds
- Price range: ₹15,000 to ₹1,50,000
- We offer custom configuration, assembly, warranty, and support
- Payment methods: UPI, Net Banking, Credit/Debit Cards, EMI via Razorpay
- Delivery: 3-5 business days for standard builds, 5-7 days for custom
- Warranty: Component warranties (1-3 years) + 1 year assembly warranty

AVAILABLE PC BUILDS:
${buildsContext}

RESPONSE GUIDELINES:
1. Be helpful, knowledgeable, and professional
2. Provide specific recommendations based on user needs
3. Include pricing in Indian Rupees (₹)
4. Suggest compatible components when relevant
5. Explain technical concepts simply
6. Always offer to help with customization
7. Keep responses concise but informative (2-3 sentences max)

ESCALATION TRIGGERS:
- Complex technical troubleshooting
- Hardware defects or warranty claims  
- Order modifications or cancellations
- Payment or refund issues
- Specific delivery date requests
- Complaints or dissatisfaction
- Requests for manager/human agent

Remember: You represent FusionForge PCs. Be confident about our products but honest about limitations.`;
  }

  // Call Gemini API with conversation context
  private async callGeminiAPI(messages: ChatMessage[]): Promise<string> {
    const url = `${this.baseUrl}?key=${this.apiKey}`;
    
    const payload = {
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text.trim();
  }

  // Determine if conversation should be escalated to human agent
  private async determineEscalation(userMessage: string, aiResponse: string): Promise<EscalationDecision> {
    const escalationKeywords = [
      'speak to manager', 'human agent', 'not working', 'broken', 'defective',
      'refund', 'cancel order', 'complaint', 'dissatisfied', 'unhappy',
      'delivery date', 'when will it arrive', 'track order', 'order status',
      'warranty claim', 'technical issue', 'not booting', 'blue screen',
      'overheating', 'noise', 'performance issue'
    ];

    const urgentKeywords = [
      'urgent', 'emergency', 'immediately', 'asap', 'right now',
      'critical', 'important', 'deadline', 'today'
    ];

    const message = userMessage.toLowerCase();
    
    // Check for escalation keywords
    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      message.includes(keyword.toLowerCase())
    );

    // Check for urgent keywords
    const hasUrgentKeyword = urgentKeywords.some(keyword =>
      message.includes(keyword.toLowerCase())
    );

    // Check if AI couldn't provide a helpful response
    const aiIndicatesEscalation = aiResponse.toLowerCase().includes('connect you') ||
                                  aiResponse.toLowerCase().includes('support team') ||
                                  aiResponse.toLowerCase().includes('human agent');

    if (hasEscalationKeyword || aiIndicatesEscalation) {
      return {
        shouldEscalate: true,
        reason: hasEscalationKeyword ? 'Customer request requires human assistance' : 'AI unable to resolve query',
        urgency: hasUrgentKeyword ? 'urgent' : 'high'
      };
    }

    // Check for medium priority escalation (technical questions)
    const technicalKeywords = ['compatibility', 'upgrade', 'installation', 'setup', 'configuration'];
    const hasTechnicalKeyword = technicalKeywords.some(keyword =>
      message.includes(keyword.toLowerCase())
    );

    if (hasTechnicalKeyword && message.length > 100) {
      return {
        shouldEscalate: true,
        reason: 'Complex technical query may need expert assistance',
        urgency: 'medium'
      };
    }

    return {
      shouldEscalate: false,
      reason: 'AI can handle this query',
      urgency: 'low'
    };
  }

  // Clear conversation history for a session
  clearSession(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  // Get conversation summary for admin handoff
  async getConversationSummary(sessionId: string): Promise<string> {
    const history = this.conversationHistory.get(sessionId);
    if (!history || history.length === 0) {
      return 'No conversation history available.';
    }

    const messages = history
      .map(msg => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.parts[0].text}`)
      .join('\n');

    return `Conversation Summary:\n${messages}`;
  }
}

export const geminiAIService = new GeminiAIService();