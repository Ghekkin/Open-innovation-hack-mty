export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
}

export interface GeminiResponse {
  text: string;
  suggestions?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}
