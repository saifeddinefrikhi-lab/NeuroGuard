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
    id: 'acceuil',
    title: 'Acceuil',
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
        id: 'reservation',
        title: 'Make a Reservation',
        type: 'item',
        url: '/patient/reservation',
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
        url: '/patient/wellness',
        icon: 'heart',
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
        id: 'alerts',
        title: 'Alerts',
        type: 'item',
        url: '/patient/alerts',
        icon: 'bell',
        breadcrumbs: false
      }
    ]
  }
];

