import { useEffect, useState } from 'react';
import { getHospitalDashboard } from '../api/hospital-dashboard.api.js';
import type { HospitalDashboardResponse } from '../types/hospital-dashboard.types.js';

interface HospitalDashboardPageProps {
  onNavigate: (path: string) => void;
}

function getSetupLabel(
  status: HospitalDashboardResponse['setup']['status'],
): string {
  switch (status) {
    case 'LIVE':
      return 'Live';
    case 'READY':
      return 'Ready for Go Live';
    case 'IN_PROGRESS':
      return 'Setup in progress';
    case 'BLOCKED':
      return 'Setup blocked';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return 'Setup not started';
  }
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="hospital-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

function ModuleCard({
  title,
  description,
  status,
  onClick,
}: {
  title: string;
  description: string;
  status: string;
  onClick: () => void;
}) {
  const configured = status === 'AVAILABLE';

  return (
    <article className="hospital-module-card">
      <div>
        <span className="hospital-module-status">
          {configured ? 'Available' : 'Not implemented'}
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={!configured}
        className="hospital-module-action"
      >
        {configured ? 'Open' : 'Coming soon'}
      </button>
    </article>
  );
}

export function HospitalDashboardPage({
  onNavigate,
}: HospitalDashboardPageProps) {
  const [dashboard, setDashboard] =
    useState<HospitalDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const result = await getHospitalDashboard();

        if (!cancelled) {
          setDashboard(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load hospital dashboard.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="hospital-dashboard-page">
        <section className="hospital-dashboard-state">
          <p className="dashboard-eyebrow">REVALTRIX HEALTHCARE PLATFORM</p>
          <h1>Loading hospital dashboard...</h1>
          <p>Loading your hospital workspace.</p>
        </section>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="hospital-dashboard-page">
        <section className="hospital-dashboard-state">
          <p className="dashboard-eyebrow">HOSPITAL DASHBOARD</p>
          <h1>Dashboard unavailable</h1>
          <p>
            {error ?? 'Unable to load hospital dashboard.'}
          </p>
          <button
            type="button"
            className="tenant-primary-action"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const setupLabel = getSetupLabel(dashboard.setup.status);

  return (
    <main className="hospital-dashboard-page">
      <header className="hospital-dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            REVALTRIX HEALTHCARE PLATFORM
          </p>
          <h1>{dashboard.tenant.name}</h1>
          <p>
            Hospital operations workspace
            {dashboard.tenant.legalName &&
              ` · ${dashboard.tenant.legalName}`}
          </p>
        </div>

        <div className="hospital-dashboard-status">
          <span>Organization status</span>
          <strong>{dashboard.tenant.status}</strong>
        </div>
      </header>

      <section className="hospital-welcome-panel">
        <div>
          <p className="dashboard-eyebrow">HOSPITAL WORKSPACE</p>
          <h2>Good to see you.</h2>
          <p>
            Manage your hospital organization, services and operational
            configuration from one workspace.
          </p>
        </div>

        <div className="hospital-readiness">
          <span>Setup readiness</span>
          <strong>{dashboard.setup.readinessPercent}%</strong>
          <small>{setupLabel}</small>
        </div>
      </section>

      <section className="hospital-stats-grid">
        <StatCard
          label="Branches"
          value={dashboard.summary.branches}
          description="Active hospital locations"
        />

        <StatCard
          label="Departments"
          value={dashboard.summary.departments}
          description="Configured departments"
        />

        <StatCard
          label="Services"
          value={dashboard.summary.services}
          description="Active healthcare services"
        />

        <StatCard
          label="Organization members"
          value={dashboard.summary.activeMembers}
          description="Active memberships"
        />
      </section>

      <section className="hospital-dashboard-grid">
        <div className="hospital-dashboard-main">
          <div className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="dashboard-card-label">
                  HOSPITAL CONFIGURATION
                </p>
                <h2>Core organization</h2>
              </div>
            </div>

            <div className="hospital-action-grid">
              <button
                type="button"
                onClick={() => onNavigate('/tenant/organization')}
              >
                <strong>Organization</strong>
                <span>Identity, legal details and contacts</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/tenant/branches')}
              >
                <strong>Branches</strong>
                <span>Manage hospital locations</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/tenant/departments')}
              >
                <strong>Departments</strong>
                <span>Structure clinical departments</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/tenant/services')}
              >
                <strong>Services</strong>
                <span>Configure healthcare services</span>
              </button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="dashboard-card-label">
                  PLATFORM MODULES
                </p>
                <h2>Hospital operations</h2>
              </div>
            </div>

            <div className="hospital-module-grid">
              <ModuleCard
                title="Patients"
                description="Patient identity, records and relationships."
                status={dashboard.capabilities.patients}
                onClick={() => onNavigate('/tenant/patients')}
              />

              <ModuleCard
                title="Appointments"
                description="Booking, scheduling and appointment workflows."
                status={dashboard.capabilities.appointments}
                onClick={() => onNavigate('/tenant/appointments')}
              />

              <ModuleCard
                title="Providers"
                description="Doctors, specialists and care providers."
                status={dashboard.capabilities.providers}
                onClick={() => onNavigate('/tenant/providers')}
              />

              <ModuleCard
                title="Encounters"
                description="Patient visits and clinical encounters."
                status={dashboard.capabilities.encounters}
                onClick={() => onNavigate('/tenant/encounters')}
              />

              <ModuleCard
                title="Queue"
                description="Check-in and patient flow management."
                status={dashboard.capabilities.queue}
                onClick={() => onNavigate('/tenant/queue')}
              />

              <ModuleCard
                title="Billing"
                description="Charges, payments and financial workflows."
                status={dashboard.capabilities.billing}
                onClick={() => onNavigate('/tenant/billing')}
              />
            </div>
          </div>
        </div>

        <aside className="hospital-dashboard-sidebar">
          <div className="dashboard-card">
            <p className="dashboard-card-label">SETUP</p>
            <h2>Organization readiness</h2>

            <div className="hospital-progress">
              <div className="hospital-progress-track">
                <div
                  className="hospital-progress-value"
                  style={{
                    width: `${dashboard.setup.readinessPercent}%`,
                  }}
                />
              </div>

              <strong>
                {dashboard.setup.readinessPercent}% complete
              </strong>
              <span>{setupLabel}</span>
            </div>

            <button
              type="button"
              className="tenant-primary-action hospital-full-action"
              onClick={() => onNavigate('/tenant/setup')}
            >
              View setup
            </button>
          </div>

          <div className="dashboard-card">
            <p className="dashboard-card-label">CURRENT ACCESS</p>
            <h2>Workspace access</h2>

            <dl className="hospital-access-list">
              <div>
                <dt>Role</dt>
                <dd>
                  {dashboard.membership.roles[0]?.name ?? 'User'}
                </dd>
              </div>

              <div>
                <dt>Branch</dt>
                <dd>
                  {dashboard.membership.branch?.name ??
                    'Organization-wide'}
                </dd>
              </div>

              <div>
                <dt>Department</dt>
                <dd>
                  {dashboard.membership.department?.name ??
                    'Organization-wide'}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  );
}
