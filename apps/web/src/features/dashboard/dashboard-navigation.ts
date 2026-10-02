import type { TenantType } from './types.js';

export type DashboardNavSection =
  | 'OVERVIEW'
  | 'ORGANIZATION'
  | 'PEOPLE'
  | 'OPERATIONS'
  | 'CLINICAL_SERVICES'
  | 'BUSINESS'
  | 'COMMUNICATION'
  | 'ANALYTICS'
  | 'INTEGRATIONS'
  | 'ADMINISTRATION';

export interface DashboardNavItem {
  key: string;
  label: string;
  path: string;
  section: DashboardNavSection;
  requiredTenantTypes?: TenantType[];
}

export interface DashboardNavGroup {
  section: DashboardNavSection;
  label: string;
  items: DashboardNavItem[];
}

const NAVIGATION: DashboardNavGroup[] = [
  {
    section: 'OVERVIEW',
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard', section: 'OVERVIEW' },
      { key: 'tasks', label: 'Tasks', path: '/tenant/tasks', section: 'OVERVIEW' },
      {
        key: 'notifications',
        label: 'Notifications',
        path: '/tenant/notifications',
        section: 'OVERVIEW',
      },
    ],
  },
  {
    section: 'ORGANIZATION',
    label: 'Organization',
    items: [
      {
        key: 'organization',
        label: 'Organization',
        path: '/tenant/organization',
        section: 'ORGANIZATION',
      },
      {
        key: 'compliance',
        label: 'Compliance & Documents',
        path: '/tenant/compliance',
        section: 'ORGANIZATION',
      },
      {
        key: 'branches',
        label: 'Branches',
        path: '/tenant/branches',
        section: 'ORGANIZATION',
      },
      {
        key: 'departments',
        label: 'Departments',
        path: '/tenant/departments',
        section: 'ORGANIZATION',
      },
      {
        key: 'services',
        label: 'Services',
        path: '/tenant/services',
        section: 'ORGANIZATION',
      },
      {
        key: 'capacity',
        label: 'Capacity',
        path: '/tenant/capacity',
        section: 'ORGANIZATION',
      },
      {
        key: 'resources',
        label: 'Resources',
        path: '/tenant/resources',
        section: 'ORGANIZATION',
      },
    ],
  },
  {
    section: 'PEOPLE',
    label: 'People',
    items: [
      {
        key: 'patients',
        label: 'Patients',
        path: '/tenant/patients',
        section: 'PEOPLE',
      },
      {
        key: 'providers',
        label: 'Providers',
        path: '/tenant/providers',
        section: 'PEOPLE',
      },
      {
        key: 'staff',
        label: 'Staff',
        path: '/tenant/staff',
        section: 'PEOPLE',
      },
      {
        key: 'roles',
        label: 'Roles & Permissions',
        path: '/tenant/access',
        section: 'PEOPLE',
      },
    ],
  },
  {
    section: 'OPERATIONS',
    label: 'Operations',
    items: [
      {
        key: 'appointments',
        label: 'Appointments',
        path: '/tenant/appointments',
        section: 'OPERATIONS',
      },
      {
        key: 'calendar',
        label: 'Calendar',
        path: '/tenant/calendar',
        section: 'OPERATIONS',
      },
      {
        key: 'queue',
        label: 'Queue',
        path: '/tenant/queue',
        section: 'OPERATIONS',
      },
      {
        key: 'patient-flow',
        label: 'Patient Flow',
        path: '/tenant/patient-flow',
        section: 'OPERATIONS',
      },
      {
        key: 'encounters',
        label: 'Encounters',
        path: '/tenant/encounters',
        section: 'OPERATIONS',
      },
      {
        key: 'referrals',
        label: 'Referrals',
        path: '/tenant/referrals',
        section: 'OPERATIONS',
      },
    ],
  },
  {
    section: 'CLINICAL_SERVICES',
    label: 'Clinical Services',
    items: [
      {
        key: 'laboratory',
        label: 'Laboratory',
        path: '/tenant/laboratory',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'CLINIC',
          'MEDICAL_CENTER',
          'DIAGNOSTIC_CENTER',
          'LABORATORY',
          'MATERNITY_CENTER',
          'HEALTHCARE_NETWORK',
        ],
      },
      {
        key: 'radiology',
        label: 'Radiology',
        path: '/tenant/radiology',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'CLINIC',
          'MEDICAL_CENTER',
          'DIAGNOSTIC_CENTER',
          'RADIOLOGY_CENTER',
          'HEALTHCARE_NETWORK',
        ],
      },
      {
        key: 'pharmacy',
        label: 'Pharmacy',
        path: '/tenant/pharmacy',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'CLINIC',
          'MEDICAL_CENTER',
          'PHARMACY',
          'MATERNITY_CENTER',
          'HEALTHCARE_NETWORK',
        ],
      },
      {
        key: 'procedures',
        label: 'Procedures',
        path: '/tenant/procedures',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'CLINIC',
          'SPECIALIST_PRACTICE',
          'MEDICAL_CENTER',
          'DENTAL_CLINIC',
          'MATERNITY_CENTER',
          'REHABILITATION_CENTER',
        ],
      },
      {
        key: 'theatre',
        label: 'Theatre',
        path: '/tenant/theatre',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'MEDICAL_CENTER',
          'MATERNITY_CENTER',
          'HEALTHCARE_NETWORK',
        ],
      },
      {
        key: 'telemedicine',
        label: 'Telemedicine',
        path: '/tenant/telemedicine',
        section: 'CLINICAL_SERVICES',
      },
      {
        key: 'home-visits',
        label: 'Home Visits',
        path: '/tenant/home-visits',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'CLINIC',
          'MEDICAL_CENTER',
          'HOME_HEALTH_PROVIDER',
          'HEALTHCARE_NETWORK',
        ],
      },
      {
        key: 'ambulance',
        label: 'Ambulance',
        path: '/tenant/ambulance',
        section: 'CLINICAL_SERVICES',
        requiredTenantTypes: [
          'HOSPITAL',
          'AMBULANCE_PROVIDER',
          'HEALTHCARE_NETWORK',
        ],
      },
    ],
  },
  {
    section: 'BUSINESS',
    label: 'Business',
    items: [
      {
        key: 'billing',
        label: 'Billing',
        path: '/tenant/billing',
        section: 'BUSINESS',
      },
      {
        key: 'payments',
        label: 'Payments',
        path: '/tenant/payments',
        section: 'BUSINESS',
      },
      {
        key: 'insurance',
        label: 'Insurance',
        path: '/tenant/insurance',
        section: 'BUSINESS',
      },
      {
        key: 'corporate',
        label: 'Corporate',
        path: '/tenant/corporate',
        section: 'BUSINESS',
      },
    ],
  },
  {
    section: 'COMMUNICATION',
    label: 'Communication',
    items: [
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        path: '/tenant/whatsapp',
        section: 'COMMUNICATION',
      },
      {
        key: 'sms',
        label: 'SMS',
        path: '/tenant/sms',
        section: 'COMMUNICATION',
      },
      {
        key: 'email',
        label: 'Email',
        path: '/tenant/email',
        section: 'COMMUNICATION',
      },
      {
        key: 'notifications',
        label: 'Notifications',
        path: '/tenant/notifications',
        section: 'COMMUNICATION',
      },
      {
        key: 'call-centre',
        label: 'Call Centre',
        path: '/tenant/call-centre',
        section: 'COMMUNICATION',
      },
    ],
  },
  {
    section: 'ANALYTICS',
    label: 'Analytics',
    items: [
      {
        key: 'reports',
        label: 'Reports',
        path: '/tenant/reports',
        section: 'ANALYTICS',
      },
      {
        key: 'analytics',
        label: 'Analytics',
        path: '/tenant/analytics',
        section: 'ANALYTICS',
      },
      {
        key: 'capacity-analytics',
        label: 'Capacity Analytics',
        path: '/tenant/analytics/capacity',
        section: 'ANALYTICS',
      },
      {
        key: 'financial-analytics',
        label: 'Financial Analytics',
        path: '/tenant/analytics/financial',
        section: 'ANALYTICS',
      },
      {
        key: 'operational-analytics',
        label: 'Operational Analytics',
        path: '/tenant/analytics/operational',
        section: 'ANALYTICS',
      },
    ],
  },
  {
    section: 'INTEGRATIONS',
    label: 'Integrations',
    items: [
      {
        key: 'integrations',
        label: 'Integrations',
        path: '/tenant/integrations',
        section: 'INTEGRATIONS',
      },
      {
        key: 'api',
        label: 'API',
        path: '/tenant/api',
        section: 'INTEGRATIONS',
      },
      {
        key: 'webhooks',
        label: 'Webhooks',
        path: '/tenant/webhooks',
        section: 'INTEGRATIONS',
      },
    ],
  },
  {
    section: 'ADMINISTRATION',
    label: 'Administration',
    items: [
      {
        key: 'settings',
        label: 'Settings',
        path: '/tenant/settings',
        section: 'ADMINISTRATION',
      },
      {
        key: 'security',
        label: 'Security',
        path: '/tenant/security',
        section: 'ADMINISTRATION',
      },
      {
        key: 'audit',
        label: 'Audit',
        path: '/tenant/audit',
        section: 'ADMINISTRATION',
      },
      {
        key: 'access-logs',
        label: 'Access Logs',
        path: '/tenant/access-logs',
        section: 'ADMINISTRATION',
      },
      {
        key: 'preferences',
        label: 'Organization Preferences',
        path: '/tenant/preferences',
        section: 'ADMINISTRATION',
      },
    ],
  },
];

export function getDashboardNavigation(
  tenantType: TenantType,
): DashboardNavGroup[] {
  return NAVIGATION
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.requiredTenantTypes ||
          item.requiredTenantTypes.includes(tenantType),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
