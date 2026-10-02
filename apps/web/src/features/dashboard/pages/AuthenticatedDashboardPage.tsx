import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard.api.js';
import {
  getTenantDashboardRoute,
  isTenantDashboardRoute,
} from '../tenant-dashboard-routes.js';
import type {
  DashboardMembership,
  DashboardResponse,
} from '../types.js';
import { TenantDashboardPage } from '../components/TenantDashboardPage.js';
import { TenantDashboardShell } from '../components/TenantDashboardShell.js';
import { OrganizationPage } from '../../organization/components/OrganizationPage.js';
import { HospitalDashboardPage } from '../components/HospitalDashboardPage.js';
import { BranchesPage } from '../../branches/components/BranchesPage.js';
import { DepartmentsPage } from '../../departments/components/DepartmentsPage.js';
import { ServicesPage } from '../../services/components/ServicesPage.js';
import { PatientsPage } from '../../patients/components/PatientsPage.js';
import { clearAuthSession } from '../../auth/api/auth-session.js';

interface AuthenticatedDashboardPageProps {
  requestedPath: string;
  onNavigate: (path: string) => void;
}

export function AuthenticatedDashboardPage({
  requestedPath,
  onNavigate,
}: AuthenticatedDashboardPageProps) {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);
  const [membership, setMembership] =
    useState<DashboardMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const result = await getDashboard();

        if (cancelled) {
          return;
        }

        setDashboard(result);

        if (!result.membership || !result.tenant) {
          setError(
            'Your account has no active organization membership. Sign in again or contact your organization administrator.',
          );
          return;
        }

        const tenantMembership = {
          ...result.membership,
          tenant: result.tenant,
        };

        if (!tenantMembership) {
          setError(
            'No active organization membership was found.',
          );
          return;
        }

        setMembership(tenantMembership);

        const authoritativeRoute = getTenantDashboardRoute(
          tenantMembership.tenant.type,
        );

        if (
          requestedPath === '/dashboard' ||
          !isTenantDashboardRoute(requestedPath)
        ) {
          onNavigate(authoritativeRoute);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        const errorMessage =
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load your dashboard.';

        const authenticationError =
          /401|unauthorized|invalid access token|authentication required|session is no longer active|expired token/i.test(
            errorMessage,
          );

        if (authenticationError) {
          clearAuthSession();
          setError(
            'Your session is invalid or has expired. Please sign in again.',
          );
          setLoading(false);
          return;
        }

        setError(errorMessage);
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
  }, [requestedPath, onNavigate]);

  function handleLogout(): void {
    clearAuthSession();
    onNavigate('/login');
  }

  if (loading) {
    return (
      <main className="registration-loading">
        <p>Loading your Revaltrix organization...</p>
      </main>
    );
  }

  if (error || !dashboard || !membership) {
    const authenticationError =
      /session is invalid|sign in again|401|unauthorized|invalid access token|authentication required|session is no longer active|expired token/i.test(
        error ?? '',
      );

    return (
      <main className="registration-loading">
        <h1>Dashboard unavailable</h1>
        <p>
          {error ??
            'Unable to resolve your organization dashboard.'}
        </p>
        {authenticationError ? (
          <button
            type="button"
            onClick={() => onNavigate('/login')}
          >
            Go to login
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setDashboard(null);
                setMembership(null);
                setLoading(true);
                onNavigate(requestedPath);
              }}
            >
              Return to dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
            >
              Go to login
            </button>
          </>
        )}
      </main>
    );
  }

  function renderTenantContent(
    resolvedMembership: DashboardMembership,
  ) {
    if (requestedPath === '/tenant/organization') {
      return (
        <OrganizationPage
          onNavigate={onNavigate}
        />
      );
    }

    if (requestedPath === '/tenant/branches') {
      return (
        <BranchesPage
          onNavigate={onNavigate}
        />
      );
    }

    if (requestedPath === '/tenant/departments') {
      return (
        <DepartmentsPage
          onNavigate={onNavigate}
        />
      );
    }

    if (requestedPath === '/tenant/services') {
      return <ServicesPage />;
    }

    if (requestedPath === '/tenant/patients') {
      return <PatientsPage onNavigate={onNavigate} />;
    }

    if (
      resolvedMembership.tenant.type === 'HOSPITAL' &&
      requestedPath === '/tenant/hospital'
    ) {
      return (
        <HospitalDashboardPage
          onNavigate={onNavigate}
        />
      );
    }

    return (
      <TenantDashboardPage
        membership={resolvedMembership}
        currentPath={requestedPath}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <TenantDashboardShell
      membership={membership}
      currentPath={requestedPath}
      onNavigate={onNavigate}
      onLogout={handleLogout}
    >
      {renderTenantContent(membership)}
    </TenantDashboardShell>
  );
}
