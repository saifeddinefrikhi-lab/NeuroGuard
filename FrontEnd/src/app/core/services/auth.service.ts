import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    private mockUsers: User[] = [
        { id: '1', name: 'Dr. Sarah Chen', email: 'sarah@alzguard.com', role: 'doctor' },
        { id: '2', name: 'James Wilson', email: 'james@alzguard.com', role: 'caregiver' },
    ];

    get isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    login(email: string, _password: string): Observable<User | null> {
        const user = this.mockUsers.find(u => u.email === email);
        return of(user || this.mockUsers[0]).pipe(
            delay(800),
            tap(u => {
                if (u) {
                    this.currentUserSubject.next(u);
                    localStorage.setItem('alzguard_user', JSON.stringify(u));
                }
            })
        );
    }

    register(name: string, email: string, _password: string, role: string): Observable<User> {
        const newUser: User = {
            id: Date.now().toString(),
            name,
            email,
            role: role as User['role'],
        };
        return of(newUser).pipe(
            delay(800),
            tap(u => {
                this.currentUserSubject.next(u);
                localStorage.setItem('alzguard_user', JSON.stringify(u));
            })
        );
    }

    logout(): void {
        this.currentUserSubject.next(null);
        localStorage.removeItem('alzguard_user');
    }

    checkAuth(): void {
        const stored = localStorage.getItem('alzguard_user');
        if (stored) {
            this.currentUserSubject.next(JSON.parse(stored));
        }
    }
}
