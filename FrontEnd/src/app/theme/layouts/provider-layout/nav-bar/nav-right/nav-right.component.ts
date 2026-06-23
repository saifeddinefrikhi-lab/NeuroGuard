// angular import
import { Component, output, inject, input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService, AppNotification } from 'src/app/core/services/notification.service';

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  BellOutline,
  SettingOutline,
  GiftOutline,
  MessageOutline,
  PhoneOutline,
  CheckCircleOutline,
  LogoutOutline,
  EditOutline,
  UserOutline,
  ProfileOutline,
  WalletOutline,
  QuestionCircleOutline,
  LockOutline,
  CommentOutline,
  UnorderedListOutline,
  ArrowRightOutline,
  GithubOutline,
  DeleteOutline,
  WarningOutline,
  ExclamationCircleOutline,
  InfoCircleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  host: { 'data-layout': 'provider', 'data-nav': 'nav-right' }
})
export class NavRightComponent implements OnInit, OnDestroy {
  private iconService = inject(IconService);
  public auth = inject(AuthService);
  public notifService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  notifications: AppNotification[] = [];
  private notifSub?: Subscription;

  styleSelectorToggle = input<boolean>();
  readonly Customize = output();
  windowWidth: number;
  screenFull: boolean = true;

  constructor() {
    this.windowWidth = window.innerWidth;
    this.iconService.addIcon(
      ...[
        CheckCircleOutline,
        GiftOutline,
        MessageOutline,
        SettingOutline,
        PhoneOutline,
        LogoutOutline,
        EditOutline,
        UserOutline,
        ProfileOutline,
        QuestionCircleOutline,
        LockOutline,
        CommentOutline,
        UnorderedListOutline,
        ArrowRightOutline,
        BellOutline,
        GithubOutline,
        WalletOutline,
        DeleteOutline,
        WarningOutline,
        ExclamationCircleOutline,
        InfoCircleOutline
      ]
    );
  }

  ngOnInit(): void {
    this.notifSub = this.notifService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifService.unreadCount;
  }

  markAllRead(): void {
    this.notifService.markAllAsRead();
  }

  dismissOne(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.notifService.dismissOne(id);
  }

  timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return new Date(date).toLocaleDateString();
  }

  profile = [
    { icon: 'edit', title: 'Edit Profile' },
    { icon: 'user', title: 'View Profile' },
    { icon: 'profile', title: 'Social Profile' },
    { icon: 'wallet', title: 'Billing' },
    { icon: 'logout', title: 'Logout', action: () => this.logout() }
  ];

  setting = [
    { icon: 'question-circle', title: 'Support' },
    { icon: 'user', title: 'Account Settings' },
    { icon: 'lock', title: 'Privacy Center' },
    { icon: 'comment', title: 'Feedback' },
    { icon: 'unordered-list', title: 'History' }
  ];

  logout() {
    this.auth.logout();
  }
}
