interface RegistrationStartPageProps {
  onSelectPatient: () => void;
  onSelectTenant: () => void;
}

export function RegistrationStartPage({
  onSelectPatient,
  onSelectTenant,
}: RegistrationStartPageProps) {
  return (
    <main className="registration-shell">
      <div className="registration-container">
        <div className="registration-intro">
          <p className="eyebrow">Revaltrix Healthcare Platform</p>
          <h1>Create your account</h1>
          <p>
            Choose the registration type that matches how you will use the
            Revaltrix platform.
          </p>
        </div>

        <div className="registration-options">
          <button
            type="button"
            className="registration-option"
            onClick={onSelectPatient}
          >
            <span className="registration-option-icon">P</span>
            <span>
              <strong>Patient</strong>
              <small>
                Create a personal healthcare account and manage your care
                journey.
              </small>
            </span>
          </button>

          <button
            type="button"
            className="registration-option"
            onClick={onSelectTenant}
          >
            <span className="registration-option-icon">O</span>
            <span>
              <strong>Healthcare organization</strong>
              <small>
                Register a hospital, clinic, laboratory, pharmacy, network,
                insurer, or other healthcare provider.
              </small>
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
