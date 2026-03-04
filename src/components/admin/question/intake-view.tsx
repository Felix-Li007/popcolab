'use client';

import { useMemo, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import type {
  IntakeDimensionOption,
  IntakeForm,
  IntakeQuestionOption,
} from '@/types/intake-form-type';
import styles from '@/styles/intake-view.module.css';

type Props = {
  form: IntakeForm | null;
  isOpen: boolean;
  onClose: () => void;
  availableQuestions: IntakeQuestionOption[];
  availableDimensions: IntakeDimensionOption[];
};

export default function IntakeView({
  form,
  isOpen,
  onClose,
  availableQuestions,
  availableDimensions,
}: Props) {
  const [activeDimensionId, setActiveDimensionId] = useState<number | null>(
    null
  );

  const questionsById = useMemo(
    () =>
      new Map(
        availableQuestions.map(question => [
          question.id,
          {
            text: question.text,
            dimensionIds: question.dimensionIds,
          },
        ])
      ),
    [availableQuestions]
  );
  const dimensionsById = new Map(
    availableDimensions.map(dimension => [
      dimension.id,
      `${dimension.categoryName} / ${dimension.indexName}`,
    ])
  );
  const formQuestionIds = form?.questionIds ?? [];
  const formDimensionIds = form?.dimensionIds ?? [];

  const dimensionTexts = formDimensionIds.map(
    dimensionId =>
      dimensionsById.get(dimensionId) ?? `Dimension #${dimensionId}`
  );
  const linkedDimensions = formDimensionIds.map((dimensionId, index) => ({
    id: dimensionId,
    label: dimensionTexts[index] ?? `Dimension #${dimensionId}`,
  }));
  const effectiveActiveDimensionId =
    activeDimensionId !== null && formDimensionIds.includes(activeDimensionId)
      ? activeDimensionId
      : null;
  const questionItems = formQuestionIds.map(questionId => {
    const questionMeta = questionsById.get(questionId);
    return {
      id: questionId,
      text: questionMeta?.text ?? `Question #${questionId}`,
      dimensionIds: questionMeta?.dimensionIds ?? [],
    };
  });
  const filteredQuestionItems =
    effectiveActiveDimensionId === null
      ? questionItems
      : questionItems.filter(question =>
          question.dimensionIds.includes(effectiveActiveDimensionId)
        );
  const statusLabel = form?.status === 1 ? 'Active' : 'Draft';

  if (!isOpen || !form) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={form.name}
      subtitle={`FORM #${form.id ?? '--'} - ${form.formType}`}
      headerMeta={
        <span
          className={
            form.status === 1 ? styles.statusActive : styles.statusDraft
          }
        >
          {statusLabel}
        </span>
      }
      rootTestId="intake-view-modal-root"
      panelTestId="intake-view-modal"
      panelClassName={`${styles.viewPanel} !max-w-3xl`}
      bodyClassName={styles.viewBody}
    >
      <div className={styles.content}>
        <div className={styles.panel}>
          <p className={styles.label}>Description</p>
          <p className={styles.description}>{form.description || '--'}</p>
        </div>
        <div className={`${styles.panel} ${styles.questionsPanel}`}>
          <p className={styles.label}>Questions ({questionItems.length})</p>
          {linkedDimensions.length === 0 ? (
            <p className={styles.empty}>No dimensions linked.</p>
          ) : (
            <div className={styles.dimensionFilterWrap}>
              <button
                type="button"
                data-testid="intake-view-dimension-filter"
                className={`${styles.dimensionFilterButton} ${
                  effectiveActiveDimensionId === null
                    ? styles.dimensionFilterActive
                    : ''
                }`}
                onClick={() => setActiveDimensionId(null)}
              >
                All
              </button>
              {linkedDimensions.map(dimension => (
                <button
                  key={`d-${form.id ?? 0}-${dimension.id}`}
                  type="button"
                  data-testid="intake-view-dimension-filter"
                  className={`${styles.dimensionFilterButton} ${
                    effectiveActiveDimensionId === dimension.id
                      ? styles.dimensionFilterActive
                      : ''
                  }`}
                  onClick={() =>
                    setActiveDimensionId(prev =>
                      prev === dimension.id ? null : dimension.id
                    )
                  }
                >
                  {dimension.label}
                </button>
              ))}
            </div>
          )}
          {filteredQuestionItems.length === 0 ? (
            <p className={styles.empty}>
              {questionItems.length === 0
                ? 'No questions linked.'
                : effectiveActiveDimensionId === null
                  ? 'No questions linked.'
                  : 'No questions match selected dimension.'}
            </p>
          ) : (
            <ul className={styles.questionList}>
              {filteredQuestionItems.map((question, index) => (
                <li
                  key={`${form.id ?? 0}-q-${question.id}-${index}`}
                  className={styles.questionItem}
                  data-testid="intake-view-question-item"
                >
                  {index + 1}. {question.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
