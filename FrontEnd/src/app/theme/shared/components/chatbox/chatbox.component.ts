import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OllamaChatService } from '../../../../core/services/ollama-chat.service';
import { CarePlanService } from '../../../../core/services/care-plan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatMessage, OllamaChatMessage } from '../../../../core/models/ollama-chat.model';
import { CarePlanResponse } from '../../../../core/models/care-plan.model';

const SYSTEM_PROMPT_BASE = `You are the NeuroGuard assistant. NeuroGuard is a healthcare application for managing patient care plans.

Your role: Answer ONLY questions about:
- The NeuroGuard website and application (features, navigation, how to use it)
- Care plans: what they are in this app, how they work (Nutrition, Sleep, Activity, Medication sections), deadlines, status (TODO/DONE), and the discussion between doctor and patient

If the user asks about something unrelated to NeuroGuard or care plans (e.g. general health, other topics), reply politely that you can only help with NeuroGuard and care plans in this application.

Keep answers concise and helpful. Use the context below about the user's care plans when relevant.`;

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatboxComponent implements AfterViewChecked {
  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLDivElement>;

  isOpen = false;
  messages: ChatMessage[] = [];
  inputText = '';
  loading = false;
  errorMessage = '';
  model = 'llama3.2';
  private scrollToBottom = false;
  /** Cached context about user's care plans, built when chat is opened */
  private carePlansContext = '';

  constructor(
    private ollama: OllamaChatService,
    private carePlanService: CarePlanService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.errorMessage = '';
    if (this.isOpen) {
      this.scrollToBottom = true;
      this.loadCarePlansContext();
    }
    this.cdr.markForCheck();
  }

  private loadCarePlansContext(): void {
    if (!this.auth.getCurrentUserId()) {
      this.carePlansContext = ' The user is not logged in; no care plans data.';
      return;
    }
    this.carePlanService.getList().subscribe({
      next: (plans: CarePlanResponse[]) => {
        if (!plans || plans.length === 0) {
          this.carePlansContext = ' The user has no care plans.';
        } else {
          const summary = plans.map((p, i) => {
            const parts = [`Plan ${i + 1} (id ${p.id})`, `Patient: ${p.patientName || p.patientId}`, `Provider: ${p.providerName || p.providerId}`, `Priority: ${p.priority || 'MEDIUM'}`];
            if (p.nutritionPlan?.trim()) parts.push(`Nutrition: ${p.nutritionPlan.slice(0, 80)}${p.nutritionPlan.length > 80 ? '...' : ''}`);
            if (p.sleepPlan?.trim()) parts.push(`Sleep: ${p.sleepPlan.slice(0, 80)}${p.sleepPlan.length > 80 ? '...' : ''}`);
            if (p.activityPlan?.trim()) parts.push(`Activity: ${p.activityPlan.slice(0, 80)}${p.activityPlan.length > 80 ? '...' : ''}`);
            if (p.medicationPlan?.trim()) parts.push(`Medication: ${p.medicationPlan.slice(0, 80)}${p.medicationPlan.length > 80 ? '...' : ''}`);
            return parts.join(' | ');
          }).join('\n');
          this.carePlansContext = `\n\nUser's care plans (use only to answer questions about their plans):\n${summary}`;
        }
      },
      error: () => {
        this.carePlansContext = ' Could not load care plans (user may have no access).';
      }
    });
  }

  close(): void {
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  ngAfterViewChecked(): void {
    if (this.scrollToBottom && this.messagesEl?.nativeElement) {
      const el = this.messagesEl.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollToBottom = false;
    }
  }

  send(): void {
    const text = (this.inputText || '').trim();
    if (!text || this.loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      date: new Date()
    };
    this.messages.push(userMsg);
    this.inputText = '';
    this.loading = true;
    this.errorMessage = '';
    this.scrollToBottom = true;
    this.cdr.markForCheck();

    const systemContent = SYSTEM_PROMPT_BASE + (this.carePlansContext || ' No care plans data loaded yet.');
    const apiMessages: OllamaChatMessage[] = [
      { role: 'system', content: systemContent },
      ...this.messages.map((m) => ({ role: m.role, content: m.content }))
    ];

    this.ollama.chat(apiMessages, this.model).subscribe({
      next: (res) => {
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.message?.content ?? 'Pas de réponse.',
          date: new Date()
        };
        this.messages.push(assistantMsg);
        this.loading = false;
        this.scrollToBottom = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message ?? 'L\'assistant est indisponible.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  clear(): void {
    this.messages = [];
    this.errorMessage = '';
    this.cdr.markForCheck();
  }
}
