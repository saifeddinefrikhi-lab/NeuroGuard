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
        title: 'Users',
        type: 'item',
        url: '/admin/users',
        classes: 'nav-item',
        icon: 'user-add', // Ant Design user-add icon
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
        title: 'Pharmacies & Clinics',
        type: 'item',
        url: '/admin/pharmacies-clinics',
        classes: 'nav-item',
        icon: 'medicine-box', // Ant Design medicine-box icon
      },
      {
        id: 'manage-medical-history',
        title: 'Medical History',
        type: 'item',
        url: '/admin/medical-history',
        classes: 'nav-item',
        icon: 'book',
      },
      {
        id: 'manage-care-plans',
        title: 'Care Plans',
        type: 'item',
        url: '/admin/care-plans',
        classes: 'nav-item',
        icon: 'heart',
      },
      {
        id: 'manage-prescriptions',
        title: 'Prescriptions',
        type: 'item',
        url: '/admin/prescriptions',
        classes: 'nav-item',
        icon: 'file-text',
      },
      {
        id: 'care-plans-stats',
        title: 'Care Plan Statistics',
        type: 'item',
        url: '/admin/care-plans/stats',
        classes: 'nav-item',
        icon: 'bar-chart',
      },
      {
        id: 'risk-analysis',
        title: 'Prescription Analysis',
        type: 'item',
        url: '/admin/risk-analysis',
        classes: 'nav-item',
        icon: 'bar-chart',
      },
      {
        id: 'admin-monitoring',
        title: 'Patient Monitoring',
        type: 'item',
        url: '/admin/monitoring',
        classes: 'nav-item',
        icon: 'line-chart',
      },
      {
        id: 'admin-wellbeing',
        title: 'Wellbeing Dashboard',
        type: 'item',
        url: '/admin/wellbeing',
        classes: 'nav-item',
        icon: 'smile',
      },
      {
        id: 'manage-products',
        title: 'Product Management',
        type: 'item',
        url: '/admin/products',
        classes: 'nav-item',
        icon: 'shopping-cart',
      },
      {
        id: 'manage-orders',
        title: 'Order Management',
        type: 'item',
        url: '/admin/orders',
        classes: 'nav-item',
        icon: 'ordered-list',
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
        id: 'generate-reports',
        title: 'Forums',
        type: 'item',
        url: '/admin/forum', // Path to generate reports
        classes: 'nav-item',
        icon: 'file-text', // Ant Design file-text icon
      },
      {
        id: 'patient-reports',
        title: 'Patient Reports',
        type: 'item',
        url: '/admin/reports/patient',
        classes: 'nav-item',
        icon: 'book', // Ant Design file icon
      },
      {
        id: 'assurance-reports',
        title: 'Assurance Reports',
        type: 'item',
        url: '/admin/assurance',
        classes: 'nav-item',
        icon: 'file-text', // Ant Design file-text icon
      },
    ]
  },
  
];

