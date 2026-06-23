import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaChatMessage
} from '../models/ollama-chat.model';

@Injectable({
  providedIn: 'root'
})
export class OllamaChatService {
  /** Requests go through gateway proxy: /api/ollama/chat -> Ollama /api/chat */
  private baseUrl = `${environment.apiUrl}/api/ollama`;

  constructor(private http: HttpClient) {}

  /**
   * Send a chat request to Ollama (non-streaming).
   * Ensure Ollama is running (ollama serve) and a model is pulled (e.g. ollama pull llama3.2).
   */
  chat(
    messages: OllamaChatMessage[],
    model: string = 'llama3.2'
  ): Observable<OllamaChatResponse> {
    const body: OllamaChatRequest = {
      model,
      messages,
      stream: false
    };
    return this.http
      .post<OllamaChatResponse>(`${this.baseUrl}/chat`, body, { responseType: 'json' })
      .pipe(
        timeout(120000),
        catchError((err) => this.handleError(err))
      );
  }

  /** List available models (GET /api/tags) */
  listModels(): Observable<{ models: { name: string }[] }> {
    return this.http
      .get<{ models: { name: string }[] }>(`${this.baseUrl}/tags`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(error: unknown): Observable<never> {
    let msg = 'L\'assistant est temporairement indisponible.';
    const err = error as { name?: string; message?: string; status?: number; error?: { message?: string } };
    if (err.name === 'TimeoutError' || err.message?.includes('Timeout')) {
      msg = 'La réponse met trop de temps. Réessayez (le modèle peut prendre 30 s ou plus).';
    } else if (typeof err.status === 'number' && err.status === 0) {
      msg = 'Connexion impossible. Vérifiez que l\'app est ouverte en http://localhost:4200 et que le service assistant est démarré (F12 → Réseau pour plus de détails).';
    } else if (err.error?.message) {
      msg = err.error.message;
    } else if (err.message) {
      msg = err.message;
    }
    return throwError(() => ({ message: msg }));
  }
}
