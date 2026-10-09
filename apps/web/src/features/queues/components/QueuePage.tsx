import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListChecks,
  PhoneCall,
  Play,
  Plus,
  RefreshCw,
  SkipForward,
  UserRound,
  UserRoundCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  callQueueEntry,
  cancelQueueEntry,
  completeQueueEntry,
  createPatientJourneyHandoff,
  createQueueCareRecord,
  createQueue,
  downloadQueueCareAttachment,
  getQueueEntries,
  getQueueCareRecords,
  getQueues,
  noShowQueueEntry,
  reconcileTodayQueues,
  skipQueueEntry,
  startQueueEntry,
  uploadQueueCareAttachment,
} from '../api/queues.api.js';
import type { QueueCareRecord } from '../api/queues.api.js';
import type { Queue, QueueEntry } from '../types/queue.types.js';
import { getDepartments } from '../../departments/api/departments.api.js';
import type { Department } from '../../departments/types/department.types.js';

interface QueuePageProps {
  onNavigate: (path: string) => void;
}

type QueueAction =
  'call' | 'start' | 'complete' | 'skip' | 'no-show' | 'cancel' | 'refer' | 'care-record';

type CarePurpose = 'record' | 'complete' | 'refer' | 'view';

function patientName(entry: QueueEntry): string {
  const name = [
    entry.patientTenantRecord.patientProfile.firstName,
    entry.patientTenantRecord.patientProfile.secondName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || 'Unnamed patient';
}

function referredHandoff(entry: QueueEntry) {
  if (entry.status !== 'COMPLETED') {
    return null;
  }

  const handoff = entry.journeySteps?.[0]?.handoffsFrom?.[0];

  if (!handoff || !['PENDING', 'ACCEPTED', 'COMPLETED'].includes(handoff.status)) {
    return null;
  }

  return handoff;
}

function isReferredEntry(entry: QueueEntry): boolean {
  return referredHandoff(entry) !== null;
}

function statusLabel(status: QueueEntry['status']): string {
  switch (status) {
    case 'WAITING':
      return 'Waiting';
    case 'CALLED':
      return 'Called';
    case 'IN_SERVICE':
      return 'In service';
    case 'COMPLETED':
      return 'Completed';
    case 'SKIPPED':
      return 'Skipped';
    case 'NO_SHOW':
      return 'No-show';
    case 'CANCELLED':
      return 'Cancelled';
    case 'CREATED':
      return 'Created';
    default:
      return status;
  }
}

function priorityLabel(priority: QueueEntry['priority']): string {
  switch (priority) {
    case 'EMERGENCY':
      return 'Emergency';
    case 'PRIORITY':
      return 'Priority';
    case 'URGENT':
      return 'Urgent';
    case 'ROUTINE':
    default:
      return 'Routine';
  }
}

function isTerminal(entry: QueueEntry): boolean {
  if (isReferredEntry(entry)) {
    return false;
  }

  return (
    entry.status === 'COMPLETED' ||
    entry.status === 'SKIPPED' ||
    entry.status === 'CANCELLED' ||
    entry.status === 'NO_SHOW'
  );
}

function formatTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderActions(
  entry: QueueEntry,
  busy: boolean,
  onAction: (entry: QueueEntry, action: QueueAction) => void,
) {
  if (isReferredEntry(entry)) {
    return (
      <button type="button" disabled={busy} onClick={() => onAction(entry, 'care-record')}>
        Open clinical record
      </button>
    );
  }

  if (isTerminal(entry)) {
    return <span>—</span>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
      }}
    >
      {entry.status === 'WAITING' ? (
        <button type="button" disabled={busy} onClick={() => onAction(entry, 'call')}>
          {busy ? 'Calling...' : 'Call'}
        </button>
      ) : null}

      {entry.status === 'CALLED' ? (
        <button type="button" disabled={busy} onClick={() => onAction(entry, 'start')}>
          Start
        </button>
      ) : null}

      {entry.status === 'IN_SERVICE' && (entry._count?.careRecords ?? 0) === 0 ? (
        <>
          <button type="button" disabled={busy} onClick={() => onAction(entry, 'care-record')}>
            Record care
          </button>
        </>
      ) : null}

      {entry.status === 'IN_SERVICE' && (entry._count?.careRecords ?? 0) > 0 ? (
        <>
          <button type="button" disabled={busy} onClick={() => onAction(entry, 'refer')}>
            Refer
          </button>
          <button type="button" disabled={busy} onClick={() => onAction(entry, 'complete')}>
            Complete
          </button>
        </>
      ) : null}

      {entry.status === 'WAITING' || entry.status === 'CALLED' ? (
        <details>
          <summary>More actions</summary>
          <div style={{ display: 'grid', gap: '0.4rem', paddingTop: '0.4rem' }}>
            {entry.status === 'WAITING' ? (
              <button type="button" disabled={busy} onClick={() => onAction(entry, 'skip')}>
                Skip
              </button>
            ) : null}
            <button type="button" disabled={busy} onClick={() => onAction(entry, 'no-show')}>
              No-show
            </button>
            <button type="button" disabled={busy} onClick={() => onAction(entry, 'cancel')}>
              Cancel
            </button>
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function QueuePage({ onNavigate }: QueuePageProps) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState(
    () => new URLSearchParams(window.location.search).get('queueId') ?? '',
  );
  const [entries, setEntries] = useState<QueueEntry[]>([]);

  const [queueName, setQueueName] = useState('');
  const [queueCode, setQueueCode] = useState('');
  const [queueDescription, setQueueDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingQueue, setSavingQueue] = useState(false);
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [careEntry, setCareEntry] = useState<QueueEntry | null>(null);
  const [careRecords, setCareRecords] = useState<QueueCareRecord[]>([]);
  const [careNote, setCareNote] = useState('');
  const [careProcedures, setCareProcedures] = useState('');
  const [careFiles, setCareFiles] = useState<File[]>([]);
  const [careDocumentUrl, setCareDocumentUrl] = useState('');
  const [carePurpose, setCarePurpose] = useState<CarePurpose>('record');
  const [savingCare, setSavingCare] = useState(false);
  const [destinationDepartmentId, setDestinationDepartmentId] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [referralInstruction, setReferralInstruction] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedQueue = queues.find((queue) => queue.id === selectedQueueId) ?? null;

  const activeEntries = useMemo(() => entries.filter((entry) => !isTerminal(entry)), [entries]);

  const waitingEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'WAITING'),
    [entries],
  );

  const calledEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'CALLED'),
    [entries],
  );

  const inServiceEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'IN_SERVICE'),
    [entries],
  );

  const loadEntries = useCallback(async (queueId: string): Promise<void> => {
    if (!queueId) {
      setEntries([]);
      return;
    }

    const result = await getQueueEntries(queueId);
    setEntries(result);
  }, []);

  const loadWorkspace = useCallback(
    async (showLoading = false): Promise<void> => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        await reconcileTodayQueues();

        const [queueResult, departmentResult] = await Promise.all([getQueues(), getDepartments()]);

        setQueues(queueResult);
        setDepartments(departmentResult);

        let nextQueueId = selectedQueueId;

        if (!nextQueueId || !queueResult.some((queue) => queue.id === nextQueueId)) {
          nextQueueId = queueResult[0]?.id ?? '';
          setSelectedQueueId(nextQueueId);
        }

        if (nextQueueId) {
          await loadEntries(nextQueueId);
        } else {
          setEntries([]);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Unable to load queue workspace.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadEntries, selectedQueueId],
  );

  useEffect(() => {
    void loadWorkspace(true);
  }, []);

  useEffect(() => {
    if (!selectedQueueId) {
      return;
    }

    void loadEntries(selectedQueueId);

    const interval = window.setInterval(() => {
      void loadEntries(selectedQueueId);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadEntries, selectedQueueId]);

  async function handleCreateQueue(): Promise<void> {
    const name = queueName.trim();
    const code = queueCode.trim();

    if (!name || !code) {
      setError('Queue name and queue code are required.');
      return;
    }

    setSavingQueue(true);
    setError(null);
    setSuccess(null);

    try {
      const queue = await createQueue({
        name,
        code,
        description: queueDescription.trim() || undefined,
      });

      setQueues((current) => [...current, queue]);
      setSelectedQueueId(queue.id);

      setQueueName('');
      setQueueCode('');
      setQueueDescription('');

      setSuccess(`${queue.code} — ${queue.name} created successfully.`);

      await loadEntries(queue.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create queue.');
    } finally {
      setSavingQueue(false);
    }
  }

  async function openCareWorkspace(
    entry: QueueEntry,
    purpose: CarePurpose = 'record',
  ): Promise<void> {
    setCareEntry(entry);
    setCarePurpose(purpose);
    setCareNote('');
    setCareProcedures('');
    setCareFiles([]);
    setCareDocumentUrl('');
    setDestinationDepartmentId('');
    setReferralReason('');
    setReferralInstruction('');
    setError(null);

    try {
      setCareRecords(await getQueueCareRecords(entry.id));
    } catch (requestError) {
      setCareEntry(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load this department care record.',
      );
    }
  }

  async function submitCareRecord(): Promise<void> {
    if (!careEntry) {
      return;
    }

    const note = careNote.trim();
    const procedures = careProcedures.trim();
    const documentUrl = careDocumentUrl.trim();
    const isReferral = carePurpose === 'refer';
    const currentStep = careEntry.journeySteps?.[0];

    if (isReferral && (!destinationDepartmentId || !referralReason.trim())) {
      setError('Select a destination department and enter a clinical referral reason.');
      return;
    }

    if (isReferral && !currentStep) {
      setError(
        'This queue entry is not linked to an active care-journey step and cannot be referred.',
      );
      return;
    }

    if (carePurpose === 'record' && !note && !procedures) {
      setError(
        'Enter a clinical note or describe the procedures performed. A document URL or file may also be included.',
      );
      return;
    }

    if (
      carePurpose === 'complete' &&
      !note &&
      !procedures &&
      !documentUrl &&
      careRecords.length === 0
    ) {
      setError('Record clinical notes or procedures before completing this department step.');
      return;
    }

    setSavingCare(true);
    setError(null);
    setSuccess(null);

    try {
      let createdRecord: { id: string } | null = null;
      let destinationStaffNotified = 0;
      let destinationName =
        departments.find((department) => department.id === destinationDepartmentId)?.name ??
        'the selected department';

      if (note || procedures || documentUrl || (isReferral && referralReason.trim())) {
        createdRecord = await createQueueCareRecord(careEntry.id, {
          note: note || (isReferral ? referralReason.trim() : undefined),
          procedures: procedures || undefined,
          documentUrl: documentUrl || undefined,
        });
      } else if (careFiles.length > 0 && careRecords.length > 0) {
        createdRecord = { id: careRecords[careRecords.length - 1].id };
      }

      if (careFiles.length > 0 && !createdRecord) {
        throw new Error('Enter a clinical note or procedure before uploading a file.');
      }

      if (createdRecord) {
        for (const file of careFiles) {
          await uploadQueueCareAttachment(createdRecord.id, file);
        }
      }

      const refreshedCareRecords = await getQueueCareRecords(careEntry.id);

      if (isReferral) {
        if (!currentStep) {
          throw new Error(
            'This queue entry is not linked to an active care-journey step and cannot be referred.',
          );
        }

        const handoffResult = await createPatientJourneyHandoff(currentStep.journeyId, {
          fromStepId: currentStep.id,
          toDepartmentId: destinationDepartmentId,
          reason: referralReason.trim(),
          instruction: referralInstruction.trim() || undefined,
        });

        destinationStaffNotified = handoffResult.data.destinationStaffNotified;
      } else if (carePurpose === 'complete') {
        await completeQueueEntry(careEntry.id);
      }

      setCareRecords(refreshedCareRecords);

      if (carePurpose === 'record') {
        setCareNote('');
        setCareProcedures('');
        setCareFiles([]);
        setCareDocumentUrl('');
        setSuccess('Department clinical record saved.');
      } else if (isReferral) {
        setSuccess(
          destinationStaffNotified > 0
            ? `${careEntry.queueNumber} referred to ${destinationName} and added to its queue. ${destinationStaffNotified} destination staff member(s) notified.`
            : `${careEntry.queueNumber} was added to ${destinationName}'s queue, but no active department staff received a notification. Check the department's staff assignments.`,
        );
        setCareEntry(null);
      } else if (carePurpose === 'complete') {
        setSuccess(`${careEntry.queueNumber} department service completed successfully.`);
        setCareEntry(null);
      }

      try {
        await loadEntries(selectedQueueId);
      } catch (refreshError) {
        const refreshMessage =
          refreshError instanceof Error ? refreshError.message : 'Unable to refresh the queue.';
        setError(`The action succeeded, but the queue could not be refreshed: ${refreshMessage}`);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save the clinical record and complete the requested action.';

      try {
        setCareRecords(await getQueueCareRecords(careEntry.id));
      } catch (refreshError) {
        const refreshMessage =
          refreshError instanceof Error
            ? refreshError.message
            : 'Unable to refresh saved care records.';
        setError(`${message} ${refreshMessage}`);
        return;
      }

      setError(message);
    } finally {
      setSavingCare(false);
    }
  }

  async function handleDownloadAttachment(attachmentId: string, fileName: string): Promise<void> {
    setError(null);

    try {
      const blob = await downloadQueueCareAttachment(attachmentId);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to download the clinical attachment.',
      );
    }
  }

  async function handleAction(entry: QueueEntry, action: QueueAction): Promise<void> {
    if (action === 'care-record') {
      await openCareWorkspace(entry, isReferredEntry(entry) ? 'view' : 'record');
      return;
    }

    if (action === 'refer') {
      await openCareWorkspace(entry, 'refer');
      return;
    }

    if (action === 'complete') {
      await openCareWorkspace(entry, 'complete');
      return;
    }

    const confirmationMessage =
      action === 'no-show'
        ? `Mark ${entry.queueNumber} as no-show?`
        : action === 'cancel'
          ? `Cancel ${entry.queueNumber}?`
          : action === 'skip'
            ? `Skip ${entry.queueNumber}?`
            : null;

    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return;
    }

    setBusyEntryId(entry.id);
    setError(null);
    setSuccess(null);

    try {
      switch (action) {
        case 'call':
          await callQueueEntry(entry.id);
          setSuccess(`${entry.queueNumber} called successfully.`);
          break;

        case 'start':
          await startQueueEntry(entry.id);
          setSuccess(`${entry.queueNumber} is now in service.`);
          break;

        case 'skip':
          await skipQueueEntry(entry.id);
          setSuccess(`${entry.queueNumber} skipped.`);
          break;

        case 'no-show':
          await noShowQueueEntry(entry.id);
          setSuccess(`${entry.queueNumber} marked as no-show.`);
          break;

        case 'cancel':
          await cancelQueueEntry(entry.id);
          setSuccess(`${entry.queueNumber} cancelled.`);
          break;
      }

      await loadEntries(selectedQueueId);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to update queue entry.',
      );
    } finally {
      setBusyEntryId(null);
    }
  }

  async function handleRefresh(): Promise<void> {
    setSuccess(null);
    await loadWorkspace(false);
  }

  if (loading) {
    return (
      <main className="registration-loading">
        <p>Loading queue workspace...</p>
      </main>
    );
  }

  return (
    <main className="queue-page">
      <header className="queue-page-header">
        <div>
          <p className="patient-dashboard-eyebrow">OPERATIONS</p>

          <h1>Queue Management</h1>

          <p>Manage today's patient flow from check-in through service completion.</p>
        </div>

        <div className="queue-page-actions">
          <button type="button" onClick={() => void handleRefresh()} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button type="button" onClick={() => onNavigate('/tenant/hospital')}>
            Back to dashboard
          </button>
        </div>
      </header>

      {error ? (
        <section className="patient-dashboard-error" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
        </section>
      ) : null}

      {success ? (
        <section style={{ marginBottom: '1rem' }}>
          <p>{success}</p>
        </section>
      ) : null}

      <section className="queue-summary-grid">
        <article className="queue-summary-card">
          <strong>{activeEntries.length}</strong>
          <p>Active patients</p>
        </article>

        <article className="queue-summary-card">
          <strong>{waitingEntries.length}</strong>
          <p>Waiting</p>
        </article>

        <article className="queue-summary-card">
          <strong>{calledEntries.length}</strong>
          <p>Called</p>
        </article>

        <article className="queue-summary-card">
          <strong>{inServiceEntries.length}</strong>
          <p>In service</p>
        </article>
      </section>

      <section className="queue-workspace-grid">
        <article className="queue-panel">
          <h2>Active queues</h2>

          {queues.length === 0 ? (
            <div>
              <p>No active queues exist yet.</p>

              <p>
                The system will automatically create the General Queue when a checked-in patient
                needs to enter today's queue.
              </p>
            </div>
          ) : (
            <div className="queue-list">
              {queues.map((queue) => (
                <button
                  key={queue.id}
                  type="button"
                  className={`queue-list-item${queue.id === selectedQueueId ? ' active' : ''}`}
                  onClick={() => setSelectedQueueId(queue.id)}
                >
                  <strong>{queue.code}</strong>
                  {' — '}
                  {queue.name}

                  {queue.department ? <span>{queue.department.name}</span> : null}

                  {queue.branch ? <span>{queue.branch.name}</span> : null}
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="queue-panel">
          <h2>Create operational queue</h2>

          <p>
            Queue creation is configuration. Patients are not manually added here; check-in creates
            queue entries automatically.
          </p>

          <div className="queue-form">
            <label>
              Queue name
              <input
                value={queueName}
                onChange={(event) => setQueueName(event.target.value)}
                maxLength={200}
                placeholder="Outpatient"
              />
            </label>

            <label>
              Queue code
              <input
                value={queueCode}
                onChange={(event) => setQueueCode(event.target.value)}
                maxLength={50}
                placeholder="OPD"
              />
            </label>

            <label>
              Description
              <textarea
                value={queueDescription}
                onChange={(event) => setQueueDescription(event.target.value)}
                maxLength={1000}
                placeholder="Main outpatient queue"
              />
            </label>

            <button type="button" onClick={() => void handleCreateQueue()} disabled={savingQueue}>
              {savingQueue ? 'Creating...' : 'Create queue'}
            </button>
          </div>
        </article>
      </section>

      <section>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2>
              {selectedQueue
                ? `${selectedQueue.code} — ${selectedQueue.name}`
                : "Today's patient queue"}
            </h2>

            <p>Patients are added automatically after encounter check-in.</p>
          </div>

          {selectedQueue ? <span>{activeEntries.length} active</span> : null}
        </header>

        {!selectedQueue ? (
          <article>
            <h3>No active queue</h3>
            <p>
              There are currently no active queues with patients. Check in a patient with an
              encounter to trigger automatic queueing.
            </p>
          </article>
        ) : entries.length === 0 ? (
          <article>
            <h3>No patients waiting</h3>
            <p>No queue entries are currently recorded for this queue.</p>

            <p>A patient will appear automatically when reception checks in today's encounter.</p>
          </article>
        ) : (
          <div className="queue-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Queue No.</th>
                  <th>Patient</th>
                  <th>Patient No.</th>
                  <th>Encounter</th>
                  <th>Presenting concern</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Checked in</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry) => {
                  const busy = busyEntryId === entry.id;

                  return (
                    <tr key={entry.id}>
                      <td>
                        <span className="queue-position">{entry.position ?? '—'}</span>
                      </td>

                      <td>
                        <strong className="queue-number">{entry.queueNumber}</strong>
                      </td>

                      <td>
                        <span className="queue-patient-name">{patientName(entry)}</span>
                      </td>

                      <td>{entry.patientTenantRecord.patientNumber}</td>

                      <td>
                        <strong>Encounter check-in</strong>
                        <br />
                        {entry.encounter.encounterNumber}
                      </td>

                      <td>{entry.reason ?? entry.encounter.reason ?? 'Not recorded'}</td>

                      <td>
                        <Badge variant="outline">{priorityLabel(entry.priority)}</Badge>
                      </td>

                      <td>
                        {(() => {
                          const handoff = referredHandoff(entry);

                          if (handoff) {
                            return (
                              <Badge>
                                Referred
                                {handoff.toDepartment?.name
                                  ? ` from ${handoff.fromDepartment?.name ?? entry.queue.department?.name ?? 'department'} → ${handoff.toDepartment.name}`
                                  : ''}
                              </Badge>
                            );
                          }

                          return <Badge>{statusLabel(entry.status)}</Badge>;
                        })()}
                      </td>

                      <td>{formatTime(entry.checkedInAt)}</td>

                      <td>
                        {renderActions(
                          entry,
                          busy,
                          (selectedEntry, action) => void handleAction(selectedEntry, action),
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {careEntry ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.55)',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="queue-care-title"
            className="queue-panel"
            style={{
              width: 'min(760px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p className="patient-dashboard-eyebrow">
                  {careEntry.queue.department?.name ?? careEntry.queue.name}
                </p>
                <h2 id="queue-care-title">
                  {carePurpose === 'refer'
                    ? `Refer ${careEntry.queueNumber}`
                    : carePurpose === 'complete'
                      ? `Complete ${careEntry.queueNumber}`
                      : `Clinical record — ${careEntry.queueNumber}`}
                </h2>
                <p>
                  {carePurpose === 'view'
                    ? 'Review the department clinical record and referral details.'
                    : 'Record this department’s clinical work. Document URL and file upload are optional.'}
                </p>
              </div>
              <button type="button" onClick={() => setCareEntry(null)}>
                Close
              </button>
            </div>
            {error ? <p role="alert">{error}</p> : null}

            {carePurpose !== 'view' ? (
              <div className="queue-form">
                <label>
                  Clinical note
                  <textarea
                    value={careNote}
                    onChange={(event) => setCareNote(event.target.value)}
                    maxLength={10000}
                    rows={4}
                    placeholder="Document findings, advice, or other care delivered in this department."
                  />
                </label>

                <label>
                  Procedures, tests, or services performed
                  <textarea
                    value={careProcedures}
                    onChange={(event) => setCareProcedures(event.target.value)}
                    maxLength={10000}
                    rows={4}
                    placeholder="Record the procedure, test, medication dispensing, imaging, or other department service."
                  />
                </label>

                <label>
                  Clinical document URL (optional)
                  <input
                    type="url"
                    value={careDocumentUrl}
                    onChange={(event) => setCareDocumentUrl(event.target.value)}
                    maxLength={2048}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Attach clinical files (PDF, DICOM, JPEG, PNG, WebP; up to 25 MB each)
                  <input
                    type="file"
                    accept=".pdf,.dcm,application/pdf,application/dicom,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      const oversized = files.find((file) => file.size > 25 * 1024 * 1024);

                      if (oversized) {
                        setError(`${oversized.name} exceeds the 25 MB per-file limit.`);
                        event.target.value = '';
                        setCareFiles([]);
                        return;
                      }

                      setError(null);
                      setCareFiles(files);
                    }}
                  />
                </label>

                {careFiles.length ? (
                  <p>{careFiles.length} file(s) ready to upload with this record.</p>
                ) : null}

                {carePurpose === 'refer' ? (
                  <>
                    <label>
                      Destination department
                      <select
                        value={destinationDepartmentId}
                        onChange={(event) => setDestinationDepartmentId(event.target.value)}
                        required
                      >
                        <option value="">Select department</option>
                        {departments
                          .filter((department) => department.id !== careEntry.queue.department?.id)
                          .map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Clinical reason for referral
                      <textarea
                        value={referralReason}
                        onChange={(event) => setReferralReason(event.target.value)}
                        maxLength={1000}
                        required
                        placeholder="Explain the clinical need and what the receiving department should assess or do."
                      />
                    </label>

                    <label>
                      Instructions for the patient / receiving team (optional)
                      <textarea
                        value={referralInstruction}
                        onChange={(event) => setReferralInstruction(event.target.value)}
                        maxLength={1000}
                        placeholder="Add preparation or wayfinding instructions."
                      />
                    </label>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={
                      savingCare ||
                      (carePurpose === 'refer' &&
                        (!destinationDepartmentId || !referralReason.trim())) ||
                      (carePurpose === 'complete' &&
                        !careNote.trim() &&
                        !careProcedures.trim() &&
                        !careDocumentUrl.trim() &&
                        careRecords.length === 0) ||
                      (carePurpose === 'record' && !careNote.trim() && !careProcedures.trim())
                    }
                    onClick={() => void submitCareRecord()}
                  >
                    {savingCare
                      ? 'Saving...'
                      : carePurpose === 'refer'
                        ? 'Save clinical record and refer'
                        : carePurpose === 'complete'
                          ? 'Save clinical record and complete'
                          : 'Save department care'}
                  </button>
                  <button type="button" disabled={savingCare} onClick={() => setCareEntry(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {carePurpose === 'view' && referredHandoff(careEntry) ? (
              <section className="queue-panel" aria-label="Referral details">
                <h3>
                  Referred from{' '}
                  {referredHandoff(careEntry)?.fromDepartment?.name ??
                    careEntry.queue.department?.name ??
                    'department'}
                  {' to '}
                  {referredHandoff(careEntry)?.toDepartment?.name ?? 'another department'}
                </h3>
                <p>
                  <strong>Clinical reason:</strong>{' '}
                  {referredHandoff(careEntry)?.reason ?? 'Not recorded'}
                </p>
                {referredHandoff(careEntry)?.instruction ? (
                  <p>
                    <strong>Instructions:</strong> {referredHandoff(careEntry)?.instruction}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div style={{ marginTop: '1.5rem' }}>
              <h3>Recorded care</h3>
              {careRecords.length === 0 ? (
                <p>No notes or procedures have been recorded in this queue step yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {careRecords.map((record) => (
                    <article key={record.id} className="queue-panel">
                      <p>
                        <strong>{record.department?.name ?? 'Department'}</strong>
                        {' · '}
                        {record.author.displayName}
                        {' · '}
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                      {record.note ? (
                        <p>
                          <strong>Note:</strong> {record.note}
                        </p>
                      ) : null}
                      {record.procedures ? (
                        <p>
                          <strong>Procedures:</strong> {record.procedures}
                        </p>
                      ) : null}
                      {record.documentUrl ? (
                        <p>
                          <strong>Document URL:</strong>{' '}
                          <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">
                            Open clinical document
                          </a>
                        </p>
                      ) : null}
                      {record.attachments.map((attachment) => (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() =>
                            void handleDownloadAttachment(attachment.id, attachment.fileName)
                          }
                        >
                          Download {attachment.fileName}
                        </button>
                      ))}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
