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
    icon: 'dashboard',  // Ant Design dashboard icon
    children: [
      {
        id: 'admin-dashboard',
        title: 'Admin Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/dashboard',
        icon: 'home', // Ant Design home icon
        breadcrumbs: false
      },
    ]
  },
  {
    id: 'user-management',
    title: 'User Management',
    type: 'group',
    icon: 'user',  // Ant Design user icon
    children: [
      {
        id: 'manage-providers',
        title: 'Healthcare Providers',
        type: 'item',
        url: '/admin/providers',
        classes: 'nav-item',
        icon: 'user-add', // Ant Design user-add icon
      },
      {
        id: 'manage-caregivers',
        title: 'Caregivers',
        type: 'item',
        url: '/admin/caregivers',
        classes: 'nav-item',
        icon: 'team', // Ant Design team icon
      },
      {
        id: 'manage-patients',
        title: 'Patients',
        type: 'item',
        url: '/admin/patients',
        classes: 'nav-item',
        icon: 'idcard', // Ant Design idcard icon
      },
      {
        id: 'manage-roles',
        title: 'Manage Roles',
        type: 'item',
        url: '/admin/roles',
        classes: 'nav-item',
        icon: 'lock', // Ant Design lock icon
      },
    ]
  },
  {
    id: 'appointment-management',
    title: 'Appointment Management',
    type: 'group',
    icon: 'schedule',  // Ant Design schedule icon
    children: [
      {
        id: 'appointments',
        title: 'Appointments',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/appointments',
        icon: 'calendar', // Ant Design calendar icon
      },
      {
        id: 'consultations',
        title: 'Consultations',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/consultations',
        icon: 'schedule', // Ant Design stethoscope icon
      },
    ]
  },
  {
    id: 'healthcare-management',
    title: 'Healthcare Management',
    type: 'group',
    icon: 'medicine-box',  // Ant Design medicine-box icon
    children: [
      {
        id: 'manage-medications',
        title: 'Manage Medications',
        type: 'item',
        url: '/admin/medications',
        classes: 'nav-item',
        icon: 'medicine-box', // Ant Design medicine-box icon
      },
      {
        id: 'manage-medical-history',
        title: 'Manage Medical History',
        type: 'item',
        url: '/admin/medical-history',
        classes: 'nav-item',
        icon: 'book', // Ant Design book icon
      },
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    type: 'group',
    icon: 'file-pdf',  // Ant Design file-pdf icon
    children: [
      {
        id: 'patient-reports',
        title: 'Patient Reports',
        type: 'item',
        url: '/admin/reports/patient',
        classes: 'nav-item',
        icon: 'book', // Ant Design file icon
      },
      {
        id: 'appointment-reports',
        title: 'Appointment Reports',
        type: 'item',
        url: '/admin/reports/appointments',
        classes: 'nav-item',
        icon: 'calendar', // Ant Design calendar icon
      },
    ]
  },
  
];

