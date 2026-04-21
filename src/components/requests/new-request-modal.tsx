'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createRequestAction,
  type CreateRequestState,
} from '@/actions/request-actions';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, Select, TextArea } from '@/ui';
import type { Question } from '@/types/question-type';
import type { UserTeamItem } from '@/services/user-team-service';

const EVENT_TYPES = [
  'Team Bonding',
  'Team Building',
  'Team Development',
  'Birthday Party',
  'Staff Party',
  'Group Of Friends Getting Together',
  'Date Night',
  'Retirement Party',
  'Hosting Clients',
  'Family Get Together',
];

const TEAM_OBJECTIVES = [
  'Strengthen team connections',
  'Spark creativity',
  'Boost morale',
  'Improve communication',
  'Encourage collaboration',
  'Try something new together',
  'Support wellness & balance',
  'Celebrate a milestone',
  'Just have fun!',
  'Other',
];

function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let h = 8; h <= 16; h++) {
    for (const m of [0, 30]) {
      if (h === 16 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${m === 0 ? '00' : '30'} ${ampm}`;
      const value = `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();
const MAX_PREFERRED_DATE_SLOTS = 3;

type PreferredDateSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

type InviteEntry = { id: string; label: string; value: string };

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  leaderQuestions: Question[];
  userTeams: UserTeamItem[];
}>;

const initial: CreateRequestState = {};

const TIME_SELECT_OPTIONS = [
  { value: '', label: 'Select a time' },
  ...TIME_OPTIONS,
];
const SOFT_TEXTAREA_CLASS =
  '!rounded-2xl !border !border-slate-300/80 !bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(241,245,249,0.58))] px-4 py-3 text-sm !font-normal text-gray-700 placeholder:text-slate-400/90 !shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(15,23,42,0.06)] !ring-0 focus:!border-teal-500/50 focus:!bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(236,253,245,0.62))] focus:!ring-[3px] focus:!ring-teal-500/15';
const BUDGET_INPUT_WRAPPER_CLASS =
  'rounded-full border border-slate-400/95 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(241,245,249,0.58))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(15,23,42,0.06)] transition focus-within:border-teal-500/50 focus-within:bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(236,253,245,0.62))] focus-within:ring-[3px] focus-within:ring-teal-500/15';
const BUDGET_INPUT_CLASS =
  'h-9 w-full appearance-none !rounded-full !border-0 !bg-transparent px-3.5 text-xs !font-normal text-gray-700 placeholder:text-slate-400/90 !shadow-none !ring-0 focus:!bg-transparent focus:!ring-0';
const WRAPPED_PILL_INPUT_WRAPPER_CLASS =
  'rounded-full border border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(241,245,249,0.58))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(15,23,42,0.06)] transition focus-within:border-teal-500/50 focus-within:bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(236,253,245,0.62))] focus-within:ring-[3px] focus-within:ring-teal-500/15';
const WRAPPED_PILL_INPUT_CLASS =
  'h-9 w-full appearance-none !rounded-full !border-0 !bg-transparent px-3.5 text-xs !font-normal text-gray-700 placeholder:text-slate-400/90 !shadow-none !ring-0 focus:!bg-transparent focus:!ring-0';
const DATE_PILL_WRAPPER_CLASS =
  'h-9 min-w-[7rem] rounded-full border border-slate-300/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(241,245,249,0.58))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(15,23,42,0.06)] transition focus-within:border-teal-500/40 focus-within:bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(236,253,245,0.62))] focus-within:ring-[3px] focus-within:ring-teal-500/15';
const DATE_PILL_INPUT_CLASS =
  'h-9 w-full appearance-none !rounded-full !border-0 !bg-transparent px-3.5 pr-8 text-xs !font-normal text-gray-700 !shadow-none !ring-0 focus:!bg-transparent focus:!ring-0';

function createPreferredDateSlot(): PreferredDateSlot {
  return {
    id: `slot-${Math.random().toString(36).slice(2, 10)}`,
    date: '',
    startTime: '',
    endTime: '',
  };
}

function buildSlotDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

function getPreferredDateSlotsError(slots: PreferredDateSlot[]) {
  if (slots.length === 0) {
    return 'Please add at least one preferred date and time slot.';
  }

  if (slots.some(slot => !slot.date || !slot.startTime || !slot.endTime)) {
    return 'Please complete the date, start time, and end time for each preferred slot.';
  }

  if (
    slots.some(
      slot =>
        buildSlotDateTime(slot.date, slot.endTime) <
        buildSlotDateTime(slot.date, slot.startTime)
    )
  ) {
    return 'Each preferred slot must end after its start time.';
  }

  return null;
}

export default function NewRequestModal({
  open,
  onClose,
  leaderQuestions,
  userTeams,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createRequestAction,
    initial
  );
  const [step, setStep] = useState(1);
  const wasPendingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Step 1 state
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [step1BudgetMin, setStep1BudgetMin] = useState('');
  const [step1BudgetMax, setStep1BudgetMax] = useState('');
  const [step1PreferredDateSlots, setStep1PreferredDateSlots] = useState<
    PreferredDateSlot[]
  >([createPreferredDateSlot()]);
  const [step1Duration, setStep1Duration] = useState('');
  const [step1GroupSize, setStep1GroupSize] = useState('');
  const [step1Location, setStep1Location] = useState('');
  const [step1EventDate, setStep1EventDate] = useState('');
  const [step1ProposalTime, setStep1ProposalTime] = useState('');
  const [step1AnythingElse, setStep1AnythingElse] = useState('');

  // Step 2 — member question answers
  const [memberAnswers, setMemberAnswers] = useState<
    Record<number, string | string[]>
  >({});

  // Step 3 — individual invites (email:xxx)
  const [individualQuery, setIndividualQuery] = useState('');
  const [individualInvites, setIndividualInvites] = useState<InviteEntry[]>([]);
  const [showIndividualSuggestions, setShowIndividualSuggestions] =
    useState(false);

  // Step 3 — team invites (team:xxx)
  const [teamQuery, setTeamQuery] = useState('');
  const [teamInvites, setTeamInvites] = useState<InviteEntry[]>([]);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);

  // Step 2 validation
  const [step2Error, setStep2Error] = useState('');

  // Step 3 validation
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (pending) {
      wasPendingRef.current = true;
    }
    if (
      wasPendingRef.current &&
      !pending &&
      !state.error &&
      !state.fieldErrors &&
      open
    ) {
      wasPendingRef.current = false;
      onClose();
    }
  }, [pending, state, open, onClose]);

  // Individual member candidates (email:xxx) — deduplicated across all teams
  const memberCandidates: InviteEntry[] = [];
  for (const team of userTeams) {
    for (const member of team.members) {
      if (!memberCandidates.some(c => c.value === `email:${member.email}`)) {
        memberCandidates.push({
          id: `member-${member.email}`,
          label: `${member.name} — ${member.email}`,
          value: `email:${member.email}`,
        });
      }
    }
  }

  // Team candidates (team:xxx)
  const teamCandidates: InviteEntry[] = userTeams.map(team => ({
    id: `team-${team.id}`,
    label: `${team.name}${team.department ? ` · ${team.department}` : ''}`,
    value: `team:${team.id}`,
  }));

  // Individual autocomplete suggestions
  const indivQuery = individualQuery.trim().toLowerCase();
  const individualSuggestions =
    indivQuery.length >= 1
      ? memberCandidates.filter(
          c =>
            c.label.toLowerCase().includes(indivQuery) &&
            !individualInvites.some(i => i.value === c.value)
        )
      : [];

  // Team autocomplete suggestions
  const tq = teamQuery.trim().toLowerCase();
  const teamSuggestions =
    tq.length >= 1
      ? teamCandidates.filter(
          c =>
            c.label.toLowerCase().includes(tq) &&
            !teamInvites.some(i => i.value === c.value)
        )
      : [];

  function addIndividualInvite(entry: InviteEntry) {
    setIndividualInvites(prev => [...prev, entry]);
    setIndividualQuery('');
    setShowIndividualSuggestions(false);
    setInviteError('');
  }

  function addFreeformIndividualInvite() {
    const v = individualQuery.trim();
    if (!v) return;
    const entry: InviteEntry = {
      id: `free-${v}`,
      label: v,
      value: `email:${v}`,
    };
    if (!individualInvites.some(i => i.value === entry.value)) {
      setIndividualInvites(prev => [...prev, entry]);
    }
    setIndividualQuery('');
    setShowIndividualSuggestions(false);
    setInviteError('');
  }

  function addEmailsFromText(text: string): boolean {
    const parts = text
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return false;
    const newEntries: InviteEntry[] = [];
    for (const email of parts) {
      const value = `email:${email}`;
      if (
        !individualInvites.some(i => i.value === value) &&
        !newEntries.some(i => i.value === value)
      ) {
        newEntries.push({ id: `free-${email}`, label: email, value });
      }
    }
    if (newEntries.length > 0) {
      setIndividualInvites(prev => [...prev, ...newEntries]);
      setInviteError('');
    }
    return true;
  }

  function removeIndividualInvite(id: string) {
    setIndividualInvites(prev => prev.filter(i => i.id !== id));
  }

  function addTeamInvite(entry: InviteEntry) {
    setTeamInvites(prev => [...prev, entry]);
    setTeamQuery('');
    setShowTeamSuggestions(false);
    setInviteError('');
  }

  function removeTeamInvite(id: string) {
    setTeamInvites(prev => prev.filter(i => i.id !== id));
  }

  function handleMemberAnswer(
    questionId: number,
    value: string,
    isMulti: boolean,
    checked?: boolean
  ) {
    setMemberAnswers(prev => {
      if (isMulti) {
        const current = (prev[questionId] as string[]) ?? [];
        return {
          ...prev,
          [questionId]: checked
            ? [...current, value]
            : current.filter(v => v !== value),
        };
      }
      return { ...prev, [questionId]: value };
    });
  }

  function toggleEventType(type: string) {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  function toggleObjective(obj: string) {
    setSelectedObjectives(prev =>
      prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
    );
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0 });
  }

  const leaderQuestionGroups = leaderQuestions.reduce<
    Array<{ title: string; questions: Question[] }>
  >((groups, question) => {
    const title =
      question.dimensions[0]?.categoryName?.trim() || 'Other Questions';
    const existingGroup = groups.find(group => group.title === title);

    if (existingGroup) {
      existingGroup.questions.push(question);
    } else {
      groups.push({ title, questions: [question] });
    }

    return groups;
  }, []);

  const invitationsStep = leaderQuestionGroups.length + 2;
  const totalSteps = invitationsStep;
  const isGeneralStep = step === 1;
  const isInvitationsStep = step === invitationsStep;
  const isTeamDetailStep = step > 1 && step < invitationsStep;
  const currentLeaderQuestionGroup = isTeamDetailStep
    ? (leaderQuestionGroups[step - 2] ?? null)
    : null;
  const currentStepLabel = isGeneralStep
    ? 'General'
    : isInvitationsStep
      ? 'Invitations'
      : (currentLeaderQuestionGroup?.title ?? 'Team Details');

  function updatePreferredDateSlot(
    slotId: string,
    field: 'date' | 'startTime' | 'endTime',
    value: string
  ) {
    setStep1PreferredDateSlots(prev =>
      prev.map(slot =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    );
  }

  function addPreferredDateSlot() {
    setStep1PreferredDateSlots(prev =>
      prev.length >= MAX_PREFERRED_DATE_SLOTS
        ? prev
        : [...prev, createPreferredDateSlot()]
    );
  }

  function removePreferredDateSlot(slotId: string) {
    setStep1PreferredDateSlots(prev =>
      prev.length === 1
        ? [createPreferredDateSlot()]
        : prev.filter(slot => slot.id !== slotId)
    );
  }

  function handleNext() {
    if (isTeamDetailStep && currentLeaderQuestionGroup) {
      const unanswered = currentLeaderQuestionGroup.questions.filter(q => {
        const answer = memberAnswers[q.id!];
        if (q.type === 'multi_choice') {
          return !Array.isArray(answer) || answer.length === 0;
        }
        return !answer || (typeof answer === 'string' && !answer.trim());
      });
      if (unanswered.length > 0) {
        setStep2Error(
          `Please answer all ${unanswered.length === 1 ? 'the question' : `all ${unanswered.length} questions`} in ${currentLeaderQuestionGroup.title} before continuing.`
        );
        return;
      }
      setStep2Error('');
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
    scrollToTop();
  }

  function handleBack() {
    setStep2Error('');
    setStep(prev => Math.max(prev - 1, 1));
    scrollToTop();
  }

  function handleSubmitClick(e: React.MouseEvent<HTMLButtonElement>) {
    const groupSize = parseInt(step1GroupSize, 10);
    if (!groupSize || groupSize <= 0) return; // no group size set — skip validation

    // Count individual invites
    const individualCount = individualInvites.length;

    // Count team members across all invited teams
    const teamMemberCount = teamInvites.reduce((sum, invite) => {
      const teamId = Number(invite.value.replace('team:', ''));
      const team = userTeams.find(t => t.id === teamId);
      return sum + (team ? team.members.length : 0);
    }, 0);

    const totalInvited = individualCount + teamMemberCount;

    if (totalInvited !== groupSize) {
      e.preventDefault();
      setInviteError(
        `You requested ${groupSize} participant${groupSize !== 1 ? 's' : ''} but have invited ${totalInvited}. Please adjust your invitations to match.`
      );
    }
  }

  if (!open) return null;

  // Serialise member answers for hidden input
  const memberAnswersJson = JSON.stringify(memberAnswers);
  const preferredDateSlotsJson = JSON.stringify(
    step1PreferredDateSlots.map(({ date, startTime, endTime }) => ({
      date,
      startTime,
      endTime,
    }))
  );

  // Combine all invite values for hidden input
  const allInvites = [...individualInvites, ...teamInvites];
  const inviteValues = allInvites.map(i => i.value).join(',');
  const progressPercent = `${(step / totalSteps) * 100}%`;
  const preferredDateSlotsError = getPreferredDateSlotsError(
    step1PreferredDateSlots
  );
  const preferredDateFieldError =
    state.fieldErrors?.startDate && preferredDateSlotsError
      ? preferredDateSlotsError
      : null;
  const eventDateFieldError =
    state.fieldErrors?.eventDate && !step1EventDate
      ? state.fieldErrors.eventDate
      : null;

  return (
    <ModalShell
      isOpen={open}
      onClose={onClose}
      title="New Request"
      showHeader={false}
      showCloseButton={false}
      panelClassName="max-w-[880px] border-white/70 shadow-[0_24px_90px_rgba(15,23,42,0.22)]"
      bodyClassName="!p-0"
    >
      <div className="flex flex-col bg-[linear-gradient(180deg,#fff_0%,#fff8fc_100%)]">
        {/* Header */}
        <div className="sticky top-0 z-10 overflow-hidden rounded-t-2xl bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.22),transparent_34%),linear-gradient(135deg,#111827_0%,#1f2937_55%,#3b0a45_100%)] px-6 pb-5 pt-5">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-pink-100/90">
                Request Planner
              </div>
              <p className="mt-3 text-xs text-slate-300">
                Step {step} of {totalSteps}
                <span className="mx-2 text-slate-500">•</span>
                {currentStepLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="relative mt-5">
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-[linear-gradient(90deg,#f9a8d4_0%,#ec4899_55%,#f97316_100%)] shadow-[0_0_18px_rgba(244,114,182,0.45)] transition-all duration-300"
                style={{ width: progressPercent }}
              />
            </div>
          </div>
        </div>

        <form action={formAction} className="flex flex-col flex-1 min-h-0">
          {/* Hidden serialised values */}
          <input
            type="hidden"
            name="eventTypes"
            value={selectedEventTypes.join(',')}
          />
          <input
            type="hidden"
            name="objectives"
            value={selectedObjectives.join(',')}
          />
          <input type="hidden" name="memberAnswers" value={memberAnswersJson} />
          <input type="hidden" name="invites" value={inviteValues} />
          <input type="hidden" name="budgetMin" value={step1BudgetMin} />
          <input type="hidden" name="budgetMax" value={step1BudgetMax} />
          <input
            type="hidden"
            name="preferredDateSlots"
            value={preferredDateSlotsJson}
          />
          <input type="hidden" name="duration" value={step1Duration} />
          <input type="hidden" name="groupSize" value={step1GroupSize} />
          <input type="hidden" name="location" value={step1Location} />
          <input type="hidden" name="eventDate" value={step1EventDate} />
          <input type="hidden" name="proposalTime" value={step1ProposalTime} />
          <input type="hidden" name="anythingElse" value={step1AnythingElse} />

          <div
            ref={scrollRef}
            className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,247,251,0.82)_100%)]"
          >
            {/* ── STEP 1 — General ── */}
            {step === 1 && (
              <div className="p-5 flex flex-col gap-4">
                {/* Q1 — Event type */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    What type of event are you looking to create experiences
                    for? <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {EVENT_TYPES.map(type => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEventTypes.includes(type)}
                          onChange={() => toggleEventType(type)}
                          className="accent-[#E91E8C] w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                  {state.fieldErrors?.eventTypes && (
                    <p className="mt-1.5 text-[11px] text-red-600">
                      {state.fieldErrors.eventTypes}
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Q2 — Team objectives */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Team Objective(s).{' '}
                    <span className="font-normal text-gray-500">
                      Choose multiple if applicable.
                    </span>{' '}
                    <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-col gap-2 mt-3">
                    {TEAM_OBJECTIVES.map(obj => (
                      <label
                        key={obj}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedObjectives.includes(obj)}
                          onChange={() => toggleObjective(obj)}
                          className="accent-[#E91E8C] w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{obj}</span>
                      </label>
                    ))}
                  </div>
                  {state.fieldErrors?.objectives && (
                    <p className="mt-1.5 text-[11px] text-red-600">
                      {state.fieldErrors.objectives}
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Q3 — Anything else */}
                <div>
                  <label
                    htmlFor="anythingElse"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Anything else we should know?
                  </label>
                  <TextArea
                    id="anythingElse"
                    rows={3}
                    inputSize="sm"
                    value={step1AnythingElse}
                    onChange={e => setStep1AnythingElse(e.target.value)}
                    className={SOFT_TEXTAREA_CLASS}
                  />
                </div>

                <hr className="border-gray-100" />

                {/* Q4 — Budget */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                    Estimated budget range?{' '}
                    <span className="font-normal text-gray-500">
                      Total or per person.
                    </span>{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="budgetMin"
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                      >
                        Minimum budget
                      </label>
                      <div className={BUDGET_INPUT_WRAPPER_CLASS}>
                        <Input
                          id="budgetMin"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          inputSize="sm"
                          placeholder="e.g. 500"
                          value={step1BudgetMin}
                          onChange={e => setStep1BudgetMin(e.target.value)}
                          className={BUDGET_INPUT_CLASS}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="budgetMax"
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                      >
                        Maximum budget
                      </label>
                      <div className={BUDGET_INPUT_WRAPPER_CLASS}>
                        <Input
                          id="budgetMax"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          inputSize="sm"
                          placeholder="e.g. 1000"
                          value={step1BudgetMax}
                          onChange={e => setStep1BudgetMax(e.target.value)}
                          className={BUDGET_INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </div>
                  {state.fieldErrors?.budget && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {state.fieldErrors?.budget}
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Q5 — Event details */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-700">
                      PREFERRED DATE <span className="text-red-500">*</span>
                    </p>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={addPreferredDateSlot}
                        disabled={
                          step1PreferredDateSlots.length >=
                          MAX_PREFERRED_DATE_SLOTS
                        }
                        className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {step1PreferredDateSlots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="relative rounded-2xl border border-gray-200 bg-white/80 p-3.5 pr-14 shadow-sm"
                      >
                        {step1PreferredDateSlots.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removePreferredDateSlot(slot.id)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-bold leading-none text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove preferred slot ${index + 1}`}
                          >
                            ×
                          </button>
                        ) : null}

                        <div className="grid gap-2.5 md:grid-cols-[1.2fr_1fr_1fr]">
                          <div>
                            <label
                              htmlFor={`preferredDate-${slot.id}`}
                              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                            >
                              Date
                            </label>
                            <div
                              className={`relative ${DATE_PILL_WRAPPER_CLASS}`}
                            >
                              <Input
                                id={`preferredDate-${slot.id}`}
                                type="date"
                                inputSize="sm"
                                value={slot.date}
                                onChange={e =>
                                  updatePreferredDateSlot(
                                    slot.id,
                                    'date',
                                    e.target.value
                                  )
                                }
                                className={`${DATE_PILL_INPUT_CLASS} w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor={`preferredStartTime-${slot.id}`}
                              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                            >
                              Start time
                            </label>
                            <Select
                              id={`preferredStartTime-${slot.id}`}
                              ariaLabel={`Preferred start time ${index + 1}`}
                              name={`preferredStartTime-${slot.id}`}
                              value={slot.startTime}
                              onChange={e =>
                                updatePreferredDateSlot(
                                  slot.id,
                                  'startTime',
                                  e.target.value
                                )
                              }
                              options={TIME_SELECT_OPTIONS}
                              className="h-auto w-full min-w-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-800"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`preferredEndTime-${slot.id}`}
                              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                            >
                              End time
                            </label>
                            <Select
                              id={`preferredEndTime-${slot.id}`}
                              ariaLabel={`Preferred end time ${index + 1}`}
                              name={`preferredEndTime-${slot.id}`}
                              value={slot.endTime}
                              onChange={e =>
                                updatePreferredDateSlot(
                                  slot.id,
                                  'endTime',
                                  e.target.value
                                )
                              }
                              options={TIME_SELECT_OPTIONS}
                              className="h-auto w-full min-w-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-800"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {preferredDateFieldError && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {preferredDateFieldError}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="duration"
                          className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                        >
                          Duration (hours)
                        </label>
                        <div className={WRAPPED_PILL_INPUT_WRAPPER_CLASS}>
                          <Input
                            id="duration"
                            type="number"
                            min={1}
                            inputSize="sm"
                            placeholder="e.g. 2"
                            value={step1Duration}
                            onChange={e => setStep1Duration(e.target.value)}
                            className={WRAPPED_PILL_INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="groupSize"
                          className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                        >
                          Group size <span className="text-red-500">*</span>
                        </label>
                        <div className={WRAPPED_PILL_INPUT_WRAPPER_CLASS}>
                          <Input
                            id="groupSize"
                            type="number"
                            min={1}
                            inputSize="sm"
                            placeholder="e.g. 20"
                            value={step1GroupSize}
                            onChange={e => setStep1GroupSize(e.target.value)}
                            className={WRAPPED_PILL_INPUT_CLASS}
                          />
                        </div>
                        {state.fieldErrors?.groupSize && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {state.fieldErrors.groupSize}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="location"
                        className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                      >
                        Location
                      </label>
                      <div className={WRAPPED_PILL_INPUT_WRAPPER_CLASS}>
                        <Input
                          id="location"
                          type="text"
                          inputSize="sm"
                          placeholder="e.g. Downtown Winnipeg"
                          value={step1Location}
                          onChange={e => setStep1Location(e.target.value)}
                          className={WRAPPED_PILL_INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Q6 — Proposal deadline */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Hard deadline for proposal?{' '}
                    <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="eventDate"
                        className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                      >
                        Date
                      </label>
                      <div className={`relative ${DATE_PILL_WRAPPER_CLASS}`}>
                        <Input
                          id="eventDate"
                          type="date"
                          inputSize="sm"
                          value={step1EventDate}
                          onChange={e => setStep1EventDate(e.target.value)}
                          className={`${DATE_PILL_INPUT_CLASS} w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                        />
                      </div>
                      {eventDateFieldError && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {eventDateFieldError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="proposalTime"
                        className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                      >
                        Time
                      </label>
                      <Select
                        id="proposalTime"
                        ariaLabel="Proposal deadline time"
                        name="proposalTimeSelect"
                        value={step1ProposalTime}
                        onChange={e => setStep1ProposalTime(e.target.value)}
                        options={TIME_SELECT_OPTIONS}
                        className="h-auto w-full min-w-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {state.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {state.error}
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 2 — Team Details ── */}
            {isTeamDetailStep && (
              <div className="p-5 flex flex-col gap-4">
                {currentLeaderQuestionGroup ? (
                  <div className="flex flex-col gap-4">
                    <section className="rounded-2xl border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                      <div className="flex flex-col gap-4">
                        {currentLeaderQuestionGroup.questions.map((q, idx) => (
                          <div key={q.id ?? idx}>
                            <p className="text-sm font-semibold text-gray-700 mb-1.5">
                              {q.text}
                            </p>
                            {q.description && (
                              <p className="text-[11px] text-gray-400 mb-1.5">
                                {q.description}
                              </p>
                            )}

                            {q.type === 'single_choice' && (
                              <div className="flex flex-col gap-1.5">
                                {q.options.map(opt => (
                                  <label
                                    key={opt.id}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name={`mq_${q.id}`}
                                      value={opt.value}
                                      checked={
                                        memberAnswers[q.id!] === opt.value
                                      }
                                      onChange={() =>
                                        handleMemberAnswer(
                                          q.id!,
                                          opt.value,
                                          false
                                        )
                                      }
                                      className="accent-[#E91E8C] w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {opt.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.type === 'multi_choice' && (
                              <div className="flex flex-col gap-1.5">
                                {q.options.map(opt => {
                                  const current =
                                    (memberAnswers[q.id!] as string[]) ?? [];
                                  return (
                                    <label
                                      key={opt.id}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        value={opt.value}
                                        checked={current.includes(opt.value)}
                                        onChange={e =>
                                          handleMemberAnswer(
                                            q.id!,
                                            opt.value,
                                            true,
                                            e.target.checked
                                          )
                                        }
                                        className="accent-[#E91E8C] w-4 h-4"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {opt.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === 'scale' && (
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() =>
                                      handleMemberAnswer(
                                        q.id!,
                                        String(n),
                                        false
                                      )
                                    }
                                    className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                                      memberAnswers[q.id!] === String(n)
                                        ? 'bg-[#E91E8C] text-white border-[#E91E8C]'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#E91E8C]'
                                    }`}
                                  >
                                    {n}
                                  </button>
                                ))}
                                <div className="flex justify-between w-full ml-2">
                                  <span className="text-[10px] text-gray-400">
                                    Strongly Disagree
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Strongly Agree
                                  </span>
                                </div>
                              </div>
                            )}

                            {q.type === 'text_input' && (
                              <TextArea
                                rows={3}
                                inputSize="sm"
                                value={(memberAnswers[q.id!] as string) ?? ''}
                                onChange={e =>
                                  handleMemberAnswer(
                                    q.id!,
                                    e.target.value,
                                    false
                                  )
                                }
                                className={SOFT_TEXTAREA_CLASS}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No team questions configured for this category.
                  </p>
                )}

                {step2Error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {step2Error}
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 3 — Invitations ── */}
            {isInvitationsStep && (
              <div className="p-5 flex flex-col gap-4">
                {/* Individual invites */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-0.5">
                    Invite Individuals
                  </p>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Optional. Use this for extra people outside the selected
                    team, or paste multiple emails separated by commas to add
                    several people at once.
                  </p>

                  {individualInvites.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {individualInvites.map(inv => (
                        <span
                          key={inv.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 px-3 py-1 text-xs font-medium text-fuchsia-800"
                        >
                          {inv.label}
                          <button
                            type="button"
                            onClick={() => removeIndividualInvite(inv.id)}
                            className="text-fuchsia-400 hover:text-fuchsia-700 leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      value={individualQuery}
                      onChange={e => {
                        const val = e.target.value;
                        // If the user typed a comma or semicolon, treat everything before it as emails
                        if (val.includes(',') || val.includes(';')) {
                          addEmailsFromText(val);
                          setIndividualQuery('');
                          setShowIndividualSuggestions(false);
                        } else {
                          setIndividualQuery(val);
                          setShowIndividualSuggestions(true);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault();
                          if (
                            individualSuggestions.length > 0 &&
                            !individualQuery.includes('@')
                          ) {
                            addIndividualInvite(individualSuggestions[0]);
                          } else if (individualQuery.trim()) {
                            addFreeformIndividualInvite();
                          }
                        }
                      }}
                      onPaste={e => {
                        const pasted = e.clipboardData.getData('text');
                        if (
                          pasted.includes(',') ||
                          pasted.includes(';') ||
                          pasted.includes(' ')
                        ) {
                          e.preventDefault();
                          addEmailsFromText(pasted);
                          setIndividualQuery('');
                          setShowIndividualSuggestions(false);
                        }
                      }}
                      onFocus={() => setShowIndividualSuggestions(true)}
                      onBlur={() =>
                        setTimeout(
                          () => setShowIndividualSuggestions(false),
                          150
                        )
                      }
                      placeholder="Type or paste emails, separate with commas…"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                    />

                    {showIndividualSuggestions &&
                      (individualSuggestions.length > 0 ||
                        individualQuery.trim()) && (
                        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                          {individualSuggestions.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={() => addIndividualInvite(s)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-800 transition-colors"
                            >
                              {s.label}
                            </button>
                          ))}
                          {individualQuery.trim() &&
                            !individualSuggestions.some(
                              s => s.value === `email:${individualQuery.trim()}`
                            ) && (
                              <button
                                type="button"
                                onMouseDown={addFreeformIndividualInvite}
                                className="w-full text-left px-4 py-2.5 text-sm text-[#E91E8C] hover:bg-pink-50 transition-colors border-t border-gray-100"
                              >
                                + Invite &quot;{individualQuery.trim()}&quot; by
                                email
                              </button>
                            )}
                        </div>
                      )}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Team invites */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-0.5">
                    Invite Teams <span className="text-red-500">*</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Invite an entire team — all members will receive an
                    invitation.
                  </p>

                  {teamInvites.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {teamInvites.map(inv => (
                        <span
                          key={inv.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800"
                        >
                          {inv.label}
                          <button
                            type="button"
                            onClick={() => removeTeamInvite(inv.id)}
                            className="text-amber-400 hover:text-amber-700 leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {teamCandidates.length > 0 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={teamQuery}
                        onChange={e => {
                          setTeamQuery(e.target.value);
                          setShowTeamSuggestions(true);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (teamSuggestions.length > 0) {
                              addTeamInvite(teamSuggestions[0]);
                            }
                          }
                        }}
                        onFocus={() => setShowTeamSuggestions(true)}
                        onBlur={() =>
                          setTimeout(() => setShowTeamSuggestions(false), 150)
                        }
                        placeholder="Search your teams…"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                      />

                      {showTeamSuggestions && teamSuggestions.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                          {teamSuggestions.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={() => addTeamInvite(s)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3">
                      You have no teams yet. Create a team first to invite them
                      here.
                    </p>
                  )}
                </div>

                {inviteError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {inviteError}
                  </p>
                )}

                {state.fieldErrors &&
                  Object.keys(state.fieldErrors).length > 0 && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      Some required fields from Step 1 are missing. Please go
                      back and fill in all required fields.
                    </p>
                  )}

                {state.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {state.error}
                  </p>
                )}
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="sticky bottom-0 z-10 mt-auto flex shrink-0 justify-between gap-3 border-t border-rose-100 bg-white/95 px-6 py-4 backdrop-blur-sm rounded-b-2xl">
            {isGeneralStep ? (
              <>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                  className="!rounded-full border-slate-200 text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  variant="primary"
                  size="md"
                  className="!rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#db2777_55%,#be185d_100%)] shadow-[0_12px_28px_rgba(236,72,153,0.28)] hover:brightness-105"
                >
                  Next →
                </Button>
              </>
            ) : !isInvitationsStep ? (
              <>
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="secondary"
                  size="md"
                  className="!rounded-full border-slate-200 text-slate-600"
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  variant="primary"
                  size="md"
                  className="!rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#db2777_55%,#be185d_100%)] shadow-[0_12px_28px_rgba(236,72,153,0.28)] hover:brightness-105"
                >
                  Next →
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="secondary"
                  size="md"
                  className="!rounded-full border-slate-200 text-slate-600"
                >
                  ← Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    size="md"
                    className="!rounded-full border-slate-200 text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={pending}
                    onClick={handleSubmitClick}
                    variant="primary"
                    size="md"
                    className="!rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#db2777_55%,#be185d_100%)] shadow-[0_12px_28px_rgba(236,72,153,0.28)] hover:brightness-105 disabled:opacity-60"
                  >
                    {pending ? 'Submitting…' : 'Submit Request →'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
