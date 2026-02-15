import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
   barHeights = [45, 60, 35, 75, 55, 85, 70];

  features = [
    {
      icon: 'monitor_heart',
      title: 'Real-Time Monitoring',
      desc: 'Track vital signs, cognitive patterns, and behavioral changes with continuous, non-invasive monitoring.',
      bg: 'rgba(235,87,87,0.08)',
      color: '#EB5757'
    },
    {
      icon: 'psychology',
      title: 'Cognitive Assessment',
      desc: 'AI-powered cognitive scoring system that tracks mental acuity trends over time with clinical precision.',
      bg: 'rgba(113,174,254,0.1)',
      color: '#71AEFE'
    },
    {
      icon: 'notifications_active',
      title: 'Smart Alerts',
      desc: 'Intelligent notification system that alerts caregivers to unusual patterns or potential emergencies.',
      bg: 'rgba(242,153,74,0.1)',
      color: '#F2994A'
    },
    {
      icon: 'analytics',
      title: 'Advanced Analytics',
      desc: 'Detailed reports and trend analysis to help healthcare providers make informed treatment decisions.',
      bg: 'rgba(39,174,96,0.08)',
      color: '#27AE60'
    },
    {
      icon: 'location_on',
      title: 'Location Tracking',
      desc: 'GPS-enabled safe zones with instant alerts when patients wander beyond designated boundaries.',
      bg: 'rgba(155,89,182,0.08)',
      color: '#9B59B6'
    },
    {
      icon: 'groups',
      title: 'Care Team Collaboration',
      desc: 'Seamless communication between doctors, caregivers, and family members in a unified platform.',
      bg: 'rgba(26,31,87,0.06)',
      color: '#1A1F57'
    },
  ];

  steps = [
    { title: 'Create Account', desc: 'Sign up as a caregiver, doctor, or family member in just a few clicks.' },
    { title: 'Add Patients', desc: 'Register patients and configure monitoring parameters and safe zones.' },
    { title: 'Monitor & Track', desc: 'Access real-time dashboards, receive smart alerts, and track cognitive trends.' },
    { title: 'Improve Care', desc: 'Use AI-driven insights and reports to optimize treatment plans and outcomes.' },
  ];

  testimonials = [
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Neurologist, Mayo Clinic',
      text: 'NeuroGuard has revolutionized how we monitor our patients. The cognitive trend analysis and bracelet integration are incredibly powerful.',
      initials: 'ER',
      avatarColor: 'linear-gradient(135deg, #1A1F57, #71AEFE)'
    },
    {
      name: 'Michael Thompson',
      role: 'Family Caregiver',
      text: 'The peace of mind this platform gives me is priceless. I can check on my mother\'s well-being anytime, anywhere.',
      initials: 'MT',
      avatarColor: 'linear-gradient(135deg, #27AE60, #6bcb77)'
    },
    {
      name: 'Sarah Mitchell',
      role: 'Care Home Director',
      text: 'Since implementing NeuroGuard, our response times to patient needs have improved by 60%. It\'s an essential tool for patient security.',
      initials: 'SM',
      avatarColor: 'linear-gradient(135deg, #F2994A, #f2c94c)'
    },
  ];

}
