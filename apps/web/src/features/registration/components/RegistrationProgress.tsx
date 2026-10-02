import type { RegistrationDashboardResponse } from '../types/registration-dashboard.types.js';

interface RegistrationProgressProps {
  steps: RegistrationDashboardResponse['steps'];
  progress: RegistrationDashboardResponse['progress'];
}

const stepLabels = [
  ['verification', 'Verify account'],
  ['profile', 'Complete profile'],
  ['password', 'Set password'],
  ['onboarding', 'Complete onboarding'],
] as const;

export function RegistrationProgress({
  steps,
  progress,
}: RegistrationProgressProps) {
  return (
    <section className="dashboard-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Registration progress</p>
          <h2>Complete your account</h2>
        </div>

        <strong className="progress-count">
          {progress.completed}/{progress.total}
        </strong>
      </div>

      <div className="progress-track" aria-label="Registration progress">
        <div
          className="progress-fill"
          style={{
            width: `${Math.round(
              (progress.completed / Math.max(progress.total, 1)) * 100,
            )}%`,
          }}
        />
      </div>

      <div className="step-list">
        {stepLabels.map(([key, label], index) => {
          const step = steps[key];
          const complete = step.complete;

          return (
            <div className="step-item" key={key}>
              <div
                className={`step-number ${complete ? 'step-complete' : ''}`}
              >
                {complete ? '✓' : index + 1}
              </div>

              <div className="step-content">
                <strong>{label}</strong>
                <span>
                  {complete
                    ? 'Completed'
                    : step.required
                      ? 'Action required'
                      : 'Optional'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
