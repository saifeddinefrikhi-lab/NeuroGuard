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
        id: 'provider-dashboard',
        title: 'Provider Home',
        type: 'item',
        classes: 'nav-item',
        url: '/provider/home', // Path to healthcare provider dashboard
        icon: 'home', // Ant Design dashboard icon
        breadcrumbs: false
      },
    ]
  },
  {
    id: 'patient-management',
    title: 'Patient Management',
    type: 'group',
    icon: 'user', // Ant Design user icon
    children: [
      {
        id: 'patient-list',
        title: 'Patients',
        type: 'item',
        url: '/provider/patients', // Path to manage patients
        classes: 'nav-item',
        icon: 'idcard', // Ant Design idcard icon
      },
      {
        id: 'patient-history',
        title: 'Medical History',
        type: 'item',
        url: '/provider/medical-history', // Path to view/manage patient medical history
        classes: 'nav-item',
        icon: 'book', // Ant Design book icon
      },
      {
        id: 'patient-medications',
        title: 'Medications',
        type: 'item',
        url: '/provider/medications', // Path to manage patient medications
        classes: 'nav-item',
        icon: 'medicine-box', // Ant Design medicine-box icon
      },
    ]
  },
  {
    id: 'appointment-management',
    title: 'Appointment Management',
    type: 'group',
    icon: 'schedule', // Ant Design schedule icon
    children: [
      {
        id: 'schedule-appointments',
        title: 'Schedule Appointments',
        type: 'item',
        classes: 'nav-item',
        url: '/provider/appointments/schedule', // Path to schedule appointments
        icon: 'calendar', // Ant Design calendar icon
      },
      {
        id: 'view-appointments',
        title: 'View Appointments',
        type: 'item',
        classes: 'nav-item',
        url: '/provider/appointments', // Path to view appointments
        icon: 'calendar', // Ant Design calendar icon
      },
    ]
  },
  {
    id: 'consultation-management',
    title: 'Consultation Management',
    type: 'group',
    icon: 'schedule', // Ant Design schedule icon
    children: [
      {
        id: 'consultation-schedule',
        title: 'Schedule Consultation',
        type: 'item',
        url: '/provider/consultations/schedule', // Path to schedule consultations
        classes: 'nav-item',
        icon: 'schedule', // Ant Design schedule icon
      },
      {
        id: 'consultation-history', 
        title: 'Consultation History',
        type: 'item',
        url: '/provider/consultations/history', // Path to view consultation history
        classes: 'nav-item',
        icon: 'history', // Ant Design history icon
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
        id: 'critical-alerts',
        title: 'Critical Alerts',
        type: 'item',
        classes: 'nav-item',
        url: '/provider/alerts/critical', // Path to view critical alerts
        icon: 'warning', // Ant Design warning icon
      },
      {
        id: 'patient-follow-up-alerts',
        title: 'Patient Follow-up Alerts',
        type: 'item',
        classes: 'nav-item',
        url: '/provider/alerts/follow-up', // Path to view follow-up alerts for patients
        icon: 'bell', // Ant Design bell icon
      },
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    type: 'group',
    icon: 'file-pdf', // Ant Design file-pdf icon
    children: [
      {
        id: 'generate-reports',
        title: 'Generate Reports',
        type: 'item',
        url: '/provider/reports/generate', // Path to generate reports
        classes: 'nav-item',
        icon: 'file-text', // Ant Design file-text icon
      },
      {
        id: 'view-reports',
        title: 'View Reports',
        type: 'item',
        url: '/provider/reports', // Path to view reports
        classes: 'nav-item',
        icon: 'bar-chart', // Ant Design bar-chart icon
      },
    ]
  },
  
  
];

