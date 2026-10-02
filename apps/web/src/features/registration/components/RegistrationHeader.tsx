import type { RegistrationDashboardResponse } from '../types/registration-dashboard.types.js';

interface RegistrationHeaderProps {
  registration: RegistrationDashboardResponse['registration'];
  account: RegistrationDashboardResponse['account'];
}

function formatRegistrationType(type: string): string {
  return type === 'TENANT' ? 'Organization registration' : 'Patient registration';
}

function formatStatus(status: string): string {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function RegistrationHeader({
  registration,
  account,
}: RegistrationHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">{formatRegistrationType(registration.type)}</p>
        <h1>Welcome, {account.displayName}</h1>
        <p className="header-description">
          Complete the remaining registration steps to activate your account.
        </p>
      </div>

      <div className="registration-status">
        <span className="status-label">Registration status</span>
        <strong>{formatStatus(registration.status)}</strong>
      </div>
    </header>
  );
}
