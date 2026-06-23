export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}


export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'home', // Ant Design home icon
    children: [
      {
        id: 'dashboard',
        title: 'Patient Home',
        type: 'item',
        classes: 'nav-item',
        url: '/patient/home',
        icon: 'home', // Ant Design dashboard icon
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'user',
    title: 'Patient Management',
    type: 'group',
    icon: 'user',
    children: [
      {
        id: 'provider',
        title: 'Healthcare Providers',
        type: 'item',
        url: '/patient/providers',
        icon: 'user-add'
      },
      {
        id: 'caregiver',
        title: 'Caregivers',
        type: 'item',
        url: '/patient/caregivers',
        icon: 'team'
      }
    ]
  },
  {
    id: 'appointment',
    title: 'Appointment Management',
    type: 'group',
    icon: 'schedule', // Ant Design schedule icon
    children: [
      {
        id: 'find-nearby',
        title: 'Find Nearby Doctors',
        type: 'item',
        url: '/patient/find-nearby-doctors',
        icon: 'appstore',
        breadcrumbs: false
      },
      {
        id: 'reservation',
        title: 'Make a Reservation',
        type: 'item',
        url: '/patient/reservations',
        icon: 'calendar'
      },
      {
        id: 'consultaion',
        title: 'Consultation History',
        type: 'item',
        url: '/patient/consultation',
        icon: 'schedule'
      }
    ]
  },

  {
    id: 'other',
    title: 'Additional Resources',
    type: 'group',
    icon: 'appstore',
    children: [
      {
        id: 'wellness',
        title: 'Wellness Tracking',
        type: 'item',
        url: '/patient/wellbeing',
        icon: 'heart',
        breadcrumbs: false
      },
      {
        id: 'monitoring',
        title: 'My Health Monitoring',
        type: 'item',
        url: '/patient/monitoring',
        icon: 'line-chart',
        breadcrumbs: false
      },
      {
        id: 'medication',
        title: 'Medication Reminders',
        type: 'item',
        url: '/patient/medication',
        icon: 'medicine-box',
        breadcrumbs: false
      },
      {
        id: 'medical-history',
        title: 'Medical History',
        type: 'item',
        url: '/patient/medical-history',
        icon: 'book',
        breadcrumbs: false
      },
      
      {
        id: 'care-plans',
        title: 'Care Plans',
        type: 'item',
        url: '/patient/care-plans',
        icon: 'heart',
        breadcrumbs: false
      },
      {
        id: 'prescriptions',
        title: 'Prescriptions',
        type: 'item',
        url: '/patient/prescriptions',
        icon: 'file-text',
        breadcrumbs: false
      },
      {
        id: 'pharmacy',
        title: 'Locate Pharmacy/Clinic',
        type: 'item',
        url: '/patient/pharmacy',
        icon: 'shop',
        breadcrumbs: false
      },
      {
        id: 'alerts',
        title: 'Alerts',
        type: 'item',
        url: '/patient/alerts',
        icon: 'bell',
        breadcrumbs: false
      },
      {
        id: 'assurance',
        title: 'Assurance',
        type: 'item',
        url: '/patient/assurance',
        icon: 'bell',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    type: 'group',
    icon: 'file-pdf',  // Ant Design file-pdf icon
    children: [
       {
        id: 'generate-reports',
        title: 'Forums',
        type: 'item',
        url: '/patient/forum', // Path to generate reports
        classes: 'nav-item',
        icon: 'file-text', // Ant Design file-text icon
      }
    ]
  }
];

