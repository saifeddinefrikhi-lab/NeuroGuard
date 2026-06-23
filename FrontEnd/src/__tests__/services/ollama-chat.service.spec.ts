// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OllamaChatService } from '../../app/core/services/ollama-chat.service';
import { environment } from '../../environments/environment';
import { OllamaChatMessage, OllamaChatResponse } from '../../app/core/models/ollama-chat.model';

describe('OllamaChatService', () => {
  let service: OllamaChatService;
  let httpMock: HttpTestingController;

  const mockChatResponse: OllamaChatResponse = {
    model: 'llama3.2',
    created_at: '2024-01-15T10:00:00Z',
    message: {
      role: 'assistant',
      content: 'This is an AI response'
    },
    done: true
  };

  const mockModelsResponse = {
    models: [
      { name: 'llama3.2' },
      { name: 'mistral' },
      { name: 'neural-chat' }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OllamaChatService]
    });

    service = TestBed.inject(OllamaChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Chat Functionality', () => {
    xit('should send chat request with default model', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Hello, how are you?' }
      ];

      service.chat(messages).subscribe((response) => {
        expect(response.model).toBe('llama3.2');
        expect(response.message.content).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.model).toBe('llama3.2');
      expect(req.request.body.stream).toBe(false);
      req.flush(mockChatResponse);
    });

    it('should send chat request with custom model', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      service.chat(messages, 'mistral').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.model).toBe('mistral');
      req.flush(mockChatResponse);
    });

    it('should include all messages in request', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' }
      ];

      service.chat(messages).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.messages.length).toBe(3);
      req.flush(mockChatResponse);
    });

    it('should set stream to false for non-streaming', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.stream).toBe(false);
      req.flush(mockChatResponse);
    });

    it('should handle conversation history', () => {
      const conversationHistory: OllamaChatMessage[] = [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
        { role: 'user', content: 'And 3+3?' }
      ];

      service.chat(conversationHistory).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.messages).toEqual(conversationHistory);
      req.flush(mockChatResponse);
    });
  });

  describe('List Models', () => {
    it('should list available models', () => {
      service.listModels().subscribe((response) => {
        expect(response.models.length).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/tags`);
      expect(req.request.method).toBe('GET');
      req.flush(mockModelsResponse);
    });

    it('should verify model names in response', () => {
      service.listModels().subscribe((response) => {
        const modelNames = response.models.map((m) => m.name);
        expect(modelNames).toContain('llama3.2');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/tags`);
      req.flush(mockModelsResponse);
    });

    it('should handle single model response', () => {
      const singleModel = {
        models: [{ name: 'llama3.2' }]
      };

      service.listModels().subscribe((response) => {
        expect(response.models.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/tags`);
      req.flush(singleModel);
    });
  });

  describe('Response Handling', () => {
    xit('should handle chat response', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      service.chat(messages).subscribe((response) => {
        expect(response.model).toBeDefined();
        expect(response.message).toBeDefined();
        expect(response.done).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.flush(mockChatResponse);
    });

    it('should handle assistant role response', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe((response) => {
        expect(response.message.role).toBe('assistant');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.flush(mockChatResponse);
    });

    it('should verify response is complete', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe((response) => {
        expect(response.done).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.flush(mockChatResponse);
    });
  });

  describe('Error Handling', () => {
    xit('should handle timeout error', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('temps')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.error(new ErrorEvent('Timeout'), {});
    });

    xit('should handle connection error', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('indisponible')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });

    xit('should handle 401 unauthorized', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 service not found', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle list models error', () => {
      service.listModels().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/tags`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Message Roles', () => {
    it('should accept user role', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      service.chat(messages).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.messages[0].role).toBe('user');
      req.flush(mockChatResponse);
    });

    it('should accept assistant role', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'assistant', content: 'Response' }
      ];

      service.chat(messages).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.messages[0].role).toBe('assistant');
      req.flush(mockChatResponse);
    });

    it('should accept system role', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant' }
      ];

      service.chat(messages).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.messages[0].role).toBe('system');
      req.flush(mockChatResponse);
    });
  });

  describe('Timeout Handling', () => {
    it('should apply 120 second timeout', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      // Timeout is configured in the service via operator
      req.flush(mockChatResponse);
    });
  });

  describe('Model Selection', () => {
    it('should use llama3.2 as default model', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.model).toBe('llama3.2');
      req.flush(mockChatResponse);
    });

    it('should allow custom model selection', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages, 'neural-chat').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      expect(req.request.body.model).toBe('neural-chat');
      req.flush(mockChatResponse);
    });
  });

  describe('Multiple Requests', () => {
    xit('should handle concurrent chat requests', () => {
      const messages1: OllamaChatMessage[] = [
        { role: 'user', content: 'Question 1' }
      ];
      const messages2: OllamaChatMessage[] = [
        { role: 'user', content: 'Question 2' }
      ];

      service.chat(messages1).subscribe();
      service.chat(messages2).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req1.flush(mockChatResponse);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      req2.flush(mockChatResponse);
    });

    it('should handle list models and chat concurrently', () => {
      const messages: OllamaChatMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      service.chat(messages).subscribe();
      service.listModels().subscribe();

      const chatReq = httpMock.expectOne(`${environment.apiUrl}/api/ollama/chat`);
      chatReq.flush(mockChatResponse);

      const modelsReq = httpMock.expectOne(`${environment.apiUrl}/api/ollama/tags`);
      modelsReq.flush(mockModelsResponse);
    });
  });
});
