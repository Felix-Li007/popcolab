'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { WORK_MODE_OPTIONS } from '@/constants/work-mode';
import {
  saveCompanyAction,
  type SaveCompanyFormState,
} from '@/actions/user-actions';
import styles from '@/styles/admin/users/company-info.module.css';
import dashboardFormStyles from '@/styles/dashboard/profile-form.module.css';
import type { CompanyInfo } from '@/types/company-type';
import { Button } from '@/ui';

const INITIAL_SAVE_STATE: SaveCompanyFormState = {
  success: false,
  message: null,
  error: null,
  values: null,
  version: 0,
};

export default function CompanyProfile({
  initialCompany,
  embedded = false,
}: {
  initialCompany?: CompanyInfo | null;
  embedded?: boolean;
}) {
  const router = useRouter();
  const initialState: SaveCompanyFormState = {
    ...INITIAL_SAVE_STATE,
    values: initialCompany ?? null,
  };
  const submitCompanyAction = async (
    prevState: SaveCompanyFormState,
    formData: FormData
  ) => {
    const nextState = await saveCompanyAction(prevState, formData);
    if (nextState.success) {
      router.refresh();
    }
    return nextState;
  };
  const [saveState, formAction, isPending] = useActionState(
    submitCompanyAction,
    initialState
  );
  const resolvedValues = saveState.values ?? initialCompany ?? null;
  const actionButton = (
    <Button
      type="submit"
      disabled={isPending}
      size="sm"
      className={dashboardFormStyles.saveButton}
    >
      {isPending ? 'Saving...' : 'Save'}
    </Button>
  );

  return (
    <div className={styles.container}>
      {!embedded ? <h2 className={styles.title}>Company details</h2> : null}

      <div className={embedded ? '' : styles.panel}>
        {embedded ? (
          <form
            // Force uncontrolled inputs to re-read the latest saved values after
            // a successful server action returns updated company data.
            key={saveState.version}
            className={dashboardFormStyles.form}
            action={formAction}
          >
            <div className={dashboardFormStyles.field}>
              <label
                htmlFor="company-name"
                className={dashboardFormStyles.label}
              >
                Company Name
              </label>
              <input
                id="company-name"
                name="companyName"
                type="text"
                defaultValue={resolvedValues?.companyName ?? ''}
                placeholder="Enter company name"
                className={dashboardFormStyles.input}
              />
            </div>

            <div className={dashboardFormStyles.field}>
              <label
                htmlFor="company-department-name"
                className={dashboardFormStyles.label}
              >
                Department Name
              </label>
              <input
                id="company-department-name"
                name="departmentName"
                type="text"
                defaultValue={resolvedValues?.departmentName ?? ''}
                placeholder="Enter department"
                className={dashboardFormStyles.input}
              />
            </div>

            <div className={dashboardFormStyles.field}>
              <label
                htmlFor="company-role-title"
                className={dashboardFormStyles.label}
              >
                Role Title
              </label>
              <input
                id="company-role-title"
                name="roleTitle"
                type="text"
                defaultValue={resolvedValues?.roleTitle ?? ''}
                placeholder="Enter role title"
                className={dashboardFormStyles.input}
              />
            </div>

            <div className={dashboardFormStyles.field}>
              <label
                htmlFor="company-size"
                className={dashboardFormStyles.label}
              >
                Company Size
              </label>
              <input
                id="company-size"
                name="companySize"
                type="number"
                min="1"
                step="1"
                defaultValue={resolvedValues?.companySize ?? ''}
                placeholder="Enter company size"
                className={dashboardFormStyles.input}
              />
            </div>

            <div className={dashboardFormStyles.field}>
              <label
                htmlFor="company-work-mode"
                className={dashboardFormStyles.label}
              >
                Work Mode
              </label>
              <select
                id="company-work-mode"
                name="workMode"
                defaultValue={resolvedValues?.workMode ?? ''}
                className={dashboardFormStyles.input}
              >
                <option value="">Select work mode</option>
                {WORK_MODE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={dashboardFormStyles.field}>
              <label
                htmlFor="company-website"
                className={dashboardFormStyles.label}
              >
                Company Website
              </label>
              <input
                id="company-website"
                name="companyWebsite"
                type="url"
                defaultValue={resolvedValues?.companyWebsite ?? ''}
                placeholder="https://example.com"
                className={dashboardFormStyles.input}
              />
            </div>

            {saveState.message ? (
              <p className={dashboardFormStyles.statusSuccess}>
                {saveState.message}
              </p>
            ) : null}
            {saveState.error ? (
              <p className={dashboardFormStyles.statusError}>
                {saveState.error}
              </p>
            ) : null}

            <div className={dashboardFormStyles.actions}>{actionButton}</div>
          </form>
        ) : (
          <form
            // Keep the standalone admin form in sync with the latest saved state
            // without converting every field into a controlled input.
            key={saveState.version}
            className={styles.form}
            action={formAction}
          >
            <div className={styles.rows}>
              <div className={styles.row}>
                <label htmlFor="company-name" className={styles.label}>
                  Company Name
                </label>
                <input
                  id="company-name"
                  name="companyName"
                  type="text"
                  defaultValue={resolvedValues?.companyName ?? ''}
                  placeholder="Enter company name"
                  className={styles.input}
                />
              </div>

              <div className={styles.row}>
                <label
                  htmlFor="company-department-name"
                  className={styles.label}
                >
                  Department Name
                </label>
                <input
                  id="company-department-name"
                  name="departmentName"
                  type="text"
                  defaultValue={resolvedValues?.departmentName ?? ''}
                  placeholder="Enter department"
                  className={styles.input}
                />
              </div>

              <div className={styles.row}>
                <label htmlFor="company-role-title" className={styles.label}>
                  Role Title
                </label>
                <input
                  id="company-role-title"
                  name="roleTitle"
                  type="text"
                  defaultValue={resolvedValues?.roleTitle ?? ''}
                  placeholder="Enter role title"
                  className={styles.input}
                />
              </div>

              <div className={styles.row}>
                <label htmlFor="company-size" className={styles.label}>
                  Company Size
                </label>
                <input
                  id="company-size"
                  name="companySize"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={resolvedValues?.companySize ?? ''}
                  placeholder="Enter company size"
                  className={styles.input}
                />
              </div>

              <div className={styles.row}>
                <label htmlFor="company-work-mode" className={styles.label}>
                  Work Mode
                </label>
                <select
                  id="company-work-mode"
                  name="workMode"
                  defaultValue={resolvedValues?.workMode ?? ''}
                  className={styles.input}
                >
                  <option value="">Select work mode</option>
                  {WORK_MODE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.row}>
                <label htmlFor="company-website" className={styles.label}>
                  Company Website
                </label>
                <input
                  id="company-website"
                  name="companyWebsite"
                  type="url"
                  defaultValue={resolvedValues?.companyWebsite ?? ''}
                  placeholder="https://example.com"
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.footer}>
              <p className={styles.statusText}>{saveState.message}</p>
              {actionButton}
            </div>
            {saveState.error ? (
              <p className={styles.errorText}>{saveState.error}</p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
