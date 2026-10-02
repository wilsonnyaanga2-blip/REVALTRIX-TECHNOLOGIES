import type { RegistrationDashboardResponse } from '../types/registration-dashboard.types.js';

interface VerificationStatusCardProps {
  verification: RegistrationDashboardResponse['verification'];
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <span className={`status-badge ${verified ? 'status-success' : 'status-pending'}`}>
      {verified ? 'Verified' : 'Pending'}
    </span>
  );
}

export function VerificationStatusCard({
  verification,
}: VerificationStatusCardProps) {
  return (
    <section className="dashboard-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Account security</p>
          <h2>Verification</h2>
        </div>

        <StatusBadge verified={verification.complete} />
      </div>

      <div className="verification-list">
        <div className="verification-row">
          <div>
            <strong>Email</strong>
            <span>{verification.email.address ?? 'Not provided'}</span>
          </div>
          <StatusBadge verified={verification.email.verified} />
        </div>

        <div className="verification-row">
          <div>
            <strong>Phone</strong>
            <span>{verification.phone.number ?? 'Not provided'}</span>
          </div>
          <StatusBadge verified={verification.phone.verified} />
        </div>
      </div>

      {!verification.complete && (
        <p className="card-note">
          Verify your account to continue with registration.
        </p>
      )}
    </section>
  );
}
