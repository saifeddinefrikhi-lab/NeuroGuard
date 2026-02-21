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
        id: 'caregiver-dashboard',
        title: 'Caregiver Home',
        type: 'item',
        classes: 'nav-item',
        url: '/caregiver/home', // Path to caregiver dashboard
        icon: 'home', // Ant Design dashboard icon
        breadcrumbs: false
      },
    ]
  },
  {
    id: 'appointment',
    title: 'Appointment Management',
    type: 'group',
    icon: 'schedule', // Ant Design schedule icon
    children: [
      {
        id: 'appointments',
        title: 'Appointments',
        type: 'item',
        classes: 'nav-item',
        url: '/caregiver/appointments', // Path to manage caregiver appointments
        icon: 'calendar', // Ant Design calendar icon
      },
      {
        id: 'consultations',
        title: 'Consultations',
        type: 'item',
        classes: 'nav-item',
        url: '/caregiver/consultations', // Path to manage consultations
        icon: 'schedule', // Ant Design stethoscope icon
      },
    ]
  },
  {
    id: 'alert-management',
    title: 'Alert Management',
    type: 'group',
    icon: 'alert', // Ant Design alert icon
    children: [
      {
        id: 'alerts',
        title: 'Alerts',
        type: 'item',
        classes: 'nav-item',
        url: '/caregiver/alerts', // Path to manage alerts for caregivers
        icon: 'bell', // Ant Design bell icon
      },
    ]
  },
  {
    id: 'well-being',
    title: 'Well-Being Management',
    type: 'group',
    icon: 'heart', // Ant Design heart icon
    children: [
      {
        id: 'patient-well-being',
        title: 'Patient Well-being',
        type: 'item',
        classes: 'nav-item',
        url: '/caregiver/well-being', // Path to monitor patient well-being
        icon: 'book', // Ant Design smile icon
      },
    ]
  },
  {
    id: 'medical-history',
    title: 'Medical History',
    type: 'group',
    icon: 'book', // Ant Design book icon
    children: [
      {
        id: 'view-medical-history',
        title: 'View Medical History',
        type: 'item',
        classes: 'nav-item',
        url: '/caregiver/medical-history/patients', // Path to view patient medical history
        icon: 'file-text', // Ant Design file-text icon
      },
    ]
  },
];

