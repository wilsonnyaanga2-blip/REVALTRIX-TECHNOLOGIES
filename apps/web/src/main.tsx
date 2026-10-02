import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { RegistrationDashboardPage } from './features/registration/pages/RegistrationDashboardPage.js';
import { LoginPage } from './features/auth/components/LoginPage.js';
import { RegistrationStartPage } from './features/registration/pages/RegistrationStartPage.js';
import { PatientRegistrationPage } from './features/registration/pages/PatientRegistrationPage.js';
import { TenantRegistrationPage } from './features/registration/pages/TenantRegistrationPage.js';
import {
  getRegistrationDashboard,
  getRegistrationToken,
} from './features/registration/api/registration-dashboard.api.js';
import {
  getAuthSession,
  clearAuthSession,
} from './features/auth/api/auth-session.js';
import { AuthenticatedDashboardPage } from './features/dashboard/pages/AuthenticatedDashboardPage.js';
import { PatientDashboardPage } from './features/patient-dashboard/pages/PatientDashboardPage.js';
import './styles.css';

type Route =
  | { name: 'start' }
  | { name: 'patient-registration' }
  | { name: 'tenant-registration' }
  | { name: 'patient-onboarding' }
  | { name: 'registration-dashboard' }
  | { name: 'authenticated-dashboard'; path: string }
  | { name: 'patient-dashboard' }
  | { name: 'login' };

function getRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/register/patient') {
    return { name: 'patient-registration' };
  }

  if (path === '/register/tenant') {
    return { name: 'tenant-registration' };
  }

  if (path === '/register/patient/onboarding') {
    return { name: 'patient-onboarding' };
  }

  if (
    path === '/register/patient/dashboard' ||
    path === '/register/tenant/dashboard'
  ) {
    return { name: 'registration-dashboard' };
  }

  if (path === '/patient/dashboard' || path.startsWith('/patient/')) {
    return { name: 'patient-dashboard' };
  }

  if (
    path === '/dashboard' ||
    path.startsWith('/tenant/')
  ) {
    return {
      name: 'authenticated-dashboard',
      path,
    };
  }

  if (path === '/login') {
    return { name: 'login' };
  }

  return { name: 'start' };
}

function navigate(path: string): void {
  if (window.location.pathname === path) {
    return;
  }

  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (route.name !== 'patient-onboarding') {
      return;
    }

    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const registrationToken = params.get('registration_token');

    if (registrationToken?.trim()) {
      window.sessionStorage.setItem(
        'revaltrix_registration_token',
        registrationToken.trim(),
      );

      window.history.replaceState(
        {},
        '',
        '/register/patient/dashboard',
      );

      setRoute({ name: 'registration-dashboard' });
      return;
    }

    const existingToken =
      window.sessionStorage.getItem('revaltrix_registration_token');

    if (existingToken) {
      window.history.replaceState(
        {},
        '',
        '/register/patient/dashboard',
      );

      setRoute({ name: 'registration-dashboard' });
      return;
    }

    window.history.replaceState({}, '', '/register/patient');
    setRoute({ name: 'patient-registration' });
  }, [route.name]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoute());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveInitialState(): Promise<void> {
      const authSession = getAuthSession();

      if (authSession) {
        if (!cancelled) {
          setCheckingSession(false);

          if (route.name === 'start' || route.name === 'login') {
            navigate('/dashboard');
          }
        }

        return;
      }

      const registrationToken = getRegistrationToken();

      if (!registrationToken) {
        if (!cancelled) {
          setCheckingSession(false);
        }

        return;
      }

      try {
        const registration = await getRegistrationDashboard();

        if (cancelled) {
          return;
        }

        const target =
          registration.registration.type === 'PATIENT'
            ? '/register/patient/dashboard'
            : '/register/tenant/dashboard';

        const currentPath =
          window.location.pathname.replace(/\/+$/, '') || '/';

        if (
          currentPath === '/' ||
          currentPath === '/register' ||
          currentPath === '/register/patient' ||
          currentPath === '/register/tenant'
        ) {
          navigate(target);
        }
      } catch {
        if (!cancelled) {
          clearAuthSession();
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void resolveInitialState();

    return () => {
      cancelled = true;
    };
  }, [route.name]);

  if (checkingSession) {
    return (
      <main className="registration-loading">
        <p>Loading Revaltrix...</p>
      </main>
    );
  }

  if (route.name === 'authenticated-dashboard') {
    return (
      <AuthenticatedDashboardPage
        requestedPath={route.path}
        onNavigate={navigate}
      />
    );
  }

  if (route.name === 'patient-dashboard') {
    return (
      <PatientDashboardPage
        onNavigate={navigate}
        onLogout={() => {
          clearAuthSession();
          navigate('/login');
        }}
      />
    );
  }

  if (route.name === 'patient-onboarding') {
    return (
      <main className="registration-loading">
        <p>Securing your onboarding session...</p>
      </main>
    );
  }

  if (route.name === 'registration-dashboard') {
    return <RegistrationDashboardPage />;
  }

  if (route.name === 'patient-registration') {
    return (
      <PatientRegistrationPage
        onBack={() => navigate('/register')}
        onSuccess={() => navigate('/register/patient/dashboard')}
      />
    );
  }

  if (route.name === 'tenant-registration') {
    return (
      <TenantRegistrationPage
        onBack={() => navigate('/register')}
        onSuccess={() => navigate('/register/tenant/dashboard')}
      />
    );
  }

  if (route.name === 'login') {
    return (
      <LoginPage
        onSuccess={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <RegistrationStartPage
      onSelectPatient={() => navigate('/register/patient')}
      onSelectTenant={() => navigate('/register/tenant')}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
