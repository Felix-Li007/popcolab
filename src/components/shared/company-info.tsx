'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { WORK_MODE_OPTIONS } from '@/constants/work-mode';
import {
  saveCompanyAction,
  type SaveCompanyFormState,
} from '@/actions/user-actions';
import styles from '@/styles/admin/users/company-info.module.css';
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
}: {
  initialCompany?: CompanyInfo | null;
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

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Company details</h2>

      <div className={styles.panel}>
        <form
          key={saveState.version}
          className={styles.form}
          action={formAction}
        >
          <div className={styles.rows}>
            <div className={styles.row}>
              <label htmlFor="company-corporate-name" className={styles.label}>
                Corporate Name
              </label>
              <input
                id="company-corporate-name"
                name="corporateName"
                type="text"
                defaultValue={resolvedValues?.corporateName ?? ''}
                placeholder="Enter company name"
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <label htmlFor="company-department-name" className={styles.label}>
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
          </div>
          <div className={styles.footer}>
            <p className={styles.statusText}>{saveState.message}</p>
            <Button
              type="submit"
              disabled={isPending}
              className={styles.saveButton}
              size="sm"
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {saveState.error ? (
            <p className={styles.errorText}>{saveState.error}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
