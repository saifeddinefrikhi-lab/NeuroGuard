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
  selector: 'app-patient-management',
  imports: [],
  templateUrl: './patient-management.html',
  styleUrl: './patient-management.scss',
})
export class PatientManagement {
// Static demo data — replace with API or service later if needed
  users: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Inactive' },
    { id: 3, name: 'Cecilia Brown', email: 'cecilia@example.com', role: 'Manager', status: 'Active' },
    { id: 4, name: 'Daniel Carter', email: 'daniel@example.com', role: 'User', status: 'Pending' },
    { id: 5, name: 'Emma Wilson', email: 'emma@example.com', role: 'User', status: 'Active' }
  ];

 
  onEdit(user: User) {
    alert(`Edit clicked`);
  }

  onDelete(user: User) {
   
    if (confirm(`Pretend to delete`)) {
     
    }
  }
}
