import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-caregiver-management',
  imports: [],
  templateUrl: './caregiver-management.html',
  styleUrl: './caregiver-management.scss',
})
export class CaregiverManagement {
// Static demo data — replace with API or service later if needed
  users: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Inactive' },
    { id: 3, name: 'Cecilia Brown', email: 'cecilia@example.com', role: 'Manager', status: 'Active' },
    { id: 4, name: 'Daniel Carter', email: 'daniel@example.com', role: 'User', status: 'Pending' },
    { id: 5, name: 'Emma Wilson', email: 'emma@example.com', role: 'User', status: 'Active' }
  ];
  onEdit(user: User) {
    alert(`Edit clicked for ${user.name}`);
  }

  onDelete(user: User) {
   
    if (confirm(`Pretend to delete ${user.name}?`)) {
      this.users = this.users.filter(u => u.id !== user.id);
    }
  }
}
