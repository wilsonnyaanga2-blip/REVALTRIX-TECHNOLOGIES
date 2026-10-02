import { FormEvent, useEffect, useState } from 'react';
import { getOrganization } from '../../organization/api/organization.api.js';
import { getBranches } from '../../branches/api/branches.api.js';
import {
  createDepartment,
  deactivateDepartment,
  getDepartments,
  updateDepartment,
} from '../api/departments.api.js';
import type { Branch } from '../../branches/types/branch.types.js';
import type { OrganizationResponse } from '../../organization/types/organization.types.js';
import type { Department } from '../types/department.types.js';

interface DepartmentsPageProps {
  onNavigate: (path: string) => void;
}

interface DepartmentFormState {
  name: string;
  code: string;
  organizationId: string;
  branchId: string;
  parentId: string;
}

const EMPTY_FORM: DepartmentFormState = {
  name: '',
  code: '',
  organizationId: '',
  branchId: '',
  parentId: '',
};

export function DepartmentsPage({
  onNavigate,
}: DepartmentsPageProps) {
  const [departments, setDepartments] = useState<Department[]>(
    [],
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [organization, setOrganization] =
    useState<OrganizationResponse | null>(null);

  const [form, setForm] =
    useState<DepartmentFormState>(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const [
        organizationResult,
        branchesResult,
        departmentsResult,
      ] = await Promise.all([
        getOrganization(),
        getBranches(),
        getDepartments(),
      ]);

      setOrganization(organizationResult);
      setBranches(branchesResult);
      setDepartments(departmentsResult);

      if (
        !editingId &&
        organizationResult.tenant.id
      ) {
        setForm((current) => ({
          ...current,
          organizationId: organizationResult.tenant.id,
        }));
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load department configuration.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm(): void {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      organizationId:
        organization?.tenant.id ?? '',
    });
  }

  function beginEdit(
    department: Department,
  ): void {
    setEditingId(department.id);

    setForm({
      name: department.name,
      code: department.code,
      organizationId:
        department.organizationId ?? '',
      branchId:
        department.branchId ?? '',
      parentId:
        department.parentId ?? '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function updateField(
    field: keyof DepartmentFormState,
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name || !code) {
      setError(
        'Department name and code are required.',
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const organizationId =
        form.organizationId || undefined;

      const branchId =
        form.branchId || undefined;

      const parentId =
        form.parentId || undefined;

      if (editingId) {
        await updateDepartment(
          editingId,
          {
            name,
            code,
            organizationId:
              organizationId ?? null,
            branchId:
              branchId ?? null,
            parentId:
              parentId ?? null,
          },
        );
      } else {
        await createDepartment({
          name,
          code,
          ...(organizationId
            ? { organizationId }
            : {}),
          ...(branchId
            ? { branchId }
            : {}),
          ...(parentId
            ? { parentId }
            : {}),
        });
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save department.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(
    department: Department,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Deactivate the "${department.name}" department?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deactivateDepartment(
        department.id,
      );

      if (editingId === department.id) {
        resetForm();
      }

      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to deactivate department.',
      );
    }
  }

  const availableParentDepartments =
    departments.filter(
      (department) =>
        department.id !== editingId,
    );

  if (loading) {
    return (
      <main className="registration-loading">
        <p>Loading department configuration...</p>
      </main>
    );
  }

  return (
    <main className="branches-layout">
      <section className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">
            ORGANIZATION
          </p>

          <h1>Departments</h1>

          <p>
            Configure departments, branch assignment,
            and department hierarchy for{' '}
            <strong>
              {organization?.tenant.name ??
                'your organization'}
            </strong>
            .
          </p>
        </div>
      </section>

      {error && (
        <div
          className="registration-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>
              {editingId
                ? 'Edit department'
                : 'Add department'}
            </h2>

            <p>
              Departments can be organization-wide or
              assigned to a specific branch.
            </p>
          </div>
        </div>

        <form
          className="tenant-form"
          onSubmit={handleSubmit}
        >
          <div className="tenant-form-grid">
            <label>
              Department name
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    'name',
                    event.target.value,
                  )
                }
                placeholder="e.g. Outpatient Department"
                maxLength={200}
                required
              />
            </label>

            <label>
              Department code
              <input
                type="text"
                value={form.code}
                onChange={(event) =>
                  updateField(
                    'code',
                    event.target.value,
                  )
                }
                placeholder="e.g. OPD"
                maxLength={50}
                required
              />
            </label>

            <label>
              Organization
              <select
                value={form.organizationId}
                onChange={(event) =>
                  updateField(
                    'organizationId',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Organization-wide
                </option>

                {organization && (
                  <option
                    value={
                      organization.tenant.id
                    }
                  >
                    {organization.tenant.name}
                  </option>
                )}
              </select>
            </label>

            <label>
              Branch
              <select
                value={form.branchId}
                onChange={(event) =>
                  updateField(
                    'branchId',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Organization-wide
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Parent department
              <select
                value={form.parentId}
                onChange={(event) =>
                  updateField(
                    'parentId',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Top-level department
                </option>

                {availableParentDepartments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name} (
                      {department.code})
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="branches-form-actions">
            <button
              type="submit"
              className="dashboard-primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save changes'
                  : 'Create department'}
            </button>

            {editingId && (
              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Department directory</h2>

            <p>
              {departments.length} active department
              {departments.length === 1
                ? ''
                : 's'}
            </p>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="branches-empty-state">
            <h3>
              No departments configured
            </h3>

            <p>
              Create your first department to
              continue configuring the organization.
            </p>
          </div>
        ) : (
          <div className="branches-list">
            {departments.map(
              (department) => (
                <article
                  key={department.id}
                  className="branch-list-item"
                >
                  <div className="branch-list-main">
                    <div>
                      <h3>
                        {department.name}
                      </h3>

                      <span className="branch-status">
                        {department.code}
                      </span>
                    </div>

                    <div className="branch-list-meta">
                      <span>
                        Organization:{' '}
                        {department.organization
                          ?.name ??
                          'Organization-wide'}
                      </span>

                      <span>
                        Branch:{' '}
                        {department.branch
                          ?.name ??
                          'Organization-wide'}
                      </span>

                      <span>
                        Parent:{' '}
                        {department.parent
                          ?.name ??
                          'Top level'}
                      </span>

                      <span>
                        Services:{' '}
                        {department._count
                          ?.services ?? 0}
                      </span>

                      <span>
                        Members:{' '}
                        {department._count
                          ?.memberships ?? 0}
                      </span>

                      <span>
                        Child departments:{' '}
                        {department._count
                          ?.children ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="branch-list-actions">
                    <button
                      type="button"
                      className="dashboard-secondary-button"
                      onClick={() =>
                        beginEdit(
                          department,
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="dashboard-danger-button"
                      onClick={() =>
                        void handleDeactivate(
                          department,
                        )
                      }
                    >
                      Deactivate
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <div className="branches-footer-actions">
        <button
          type="button"
          className="dashboard-secondary-button"
          onClick={() =>
            onNavigate('/tenant/branches')
          }
        >
          Back to branches
        </button>

        <button
          type="button"
          className="dashboard-secondary-button"
          onClick={() =>
            onNavigate('/tenant/organization')
          }
        >
          Organization profile
        </button>
      </div>
    </main>
  );
}
