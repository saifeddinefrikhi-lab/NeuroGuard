/** Message for Ollama chat API */
export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Request body for POST /api/chat (Ollama) */
export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
}

/** Response when stream: false */
export interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done?: boolean;
}

/** UI message in the chatbox */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  date: Date;
}
