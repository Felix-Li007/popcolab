'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createRequestAction,
  type CreateRequestState,
} from '@/actions/request-actions';
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

type InviteEntry = { id: string; label: string; value: string };

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  leaderQuestions: Question[];
  userTeams: UserTeamItem[];
}>;

const initial: CreateRequestState = {};

const STEP_LABELS = ['General', 'Team Details', 'Invitations'];

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const wasPendingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Step 1 state
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [step1Budget, setStep1Budget] = useState('');
  const [step1StartDate, setStep1StartDate] = useState('');
  const [step1StartTime, setStep1StartTime] = useState('');
  const [step1EndTime, setStep1EndTime] = useState('');
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

  function handleNext() {
    if (step === 2 && leaderQuestions.length > 0) {
      const unanswered = leaderQuestions.filter(q => {
        const answer = memberAnswers[q.id!];
        if (q.type === 'multi_choice') {
          return !Array.isArray(answer) || answer.length === 0;
        }
        return !answer || (typeof answer === 'string' && !answer.trim());
      });
      if (unanswered.length > 0) {
        setStep2Error(
          `Please answer all ${unanswered.length === 1 ? 'the question' : `all ${unanswered.length} questions`} before continuing.`
        );
        return;
      }
      setStep2Error('');
    }
    setStep(prev => (prev === 1 ? 2 : 3) as 1 | 2 | 3);
    scrollToTop();
  }

  function handleBack() {
    setStep(prev => (prev === 3 ? 2 : 1) as 1 | 2 | 3);
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
  const memberAnswersJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(memberAnswers).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join('|') : v,
      ])
    )
  );

  // Combine all invite values for hidden input
  const allInvites = [...individualInvites, ...teamInvites];
  const inviteValues = allInvites.map(i => i.value).join(',');

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#111827] px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-white">+ New Request</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-gray-100">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 -mb-px ${
                step === i + 1
                  ? 'border-[#E91E8C] text-[#E91E8C]'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {i + 1}. {label}
            </div>
          ))}
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
          <input type="hidden" name="budget" value={step1Budget} />
          <input type="hidden" name="startDate" value={step1StartDate} />
          <input type="hidden" name="startTime" value={step1StartTime} />
          <input type="hidden" name="endTime" value={step1EndTime} />
          <input type="hidden" name="duration" value={step1Duration} />
          <input type="hidden" name="groupSize" value={step1GroupSize} />
          <input type="hidden" name="location" value={step1Location} />
          <input type="hidden" name="eventDate" value={step1EventDate} />
          <input type="hidden" name="proposalTime" value={step1ProposalTime} />
          <input type="hidden" name="anythingElse" value={step1AnythingElse} />

          <div ref={scrollRef} className="flex-1 overflow-y-scroll">
            {/* ── STEP 1 — General ── */}
            {step === 1 && (
              <div className="p-6 flex flex-col gap-6">
                {/* Q1 — Event type */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
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
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Anything else we should know?
                  </label>
                  <textarea
                    id="anythingElse"
                    rows={3}
                    value={step1AnythingElse}
                    onChange={e => setStep1AnythingElse(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white resize-none"
                  />
                </div>

                <hr className="border-gray-100" />

                {/* Q4 — Budget */}
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Estimated budget range?{' '}
                    <span className="font-normal text-gray-500">
                      Total or per person.
                    </span>{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="budget"
                    type="text"
                    placeholder="e.g. $500–$1,000 total or $50 per person"
                    value={step1Budget}
                    onChange={e => setStep1Budget(e.target.value)}
                    className="w-full mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                  />
                  {state.fieldErrors?.budget && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {state.fieldErrors?.budget}
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Q5 — Event details */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Event details <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                      >
                        Date
                      </label>
                      <div className="relative">
                        <input
                          id="startDate"
                          type="date"
                          value={step1StartDate}
                          onChange={e => setStep1StartDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-9 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      {state.fieldErrors?.startDate && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {state.fieldErrors.startDate}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="startTime"
                          className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                        >
                          Start time
                        </label>
                        <select
                          id="startTime"
                          value={step1StartTime}
                          onChange={e => setStep1StartTime(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                        >
                          <option value="" disabled>
                            Select a time
                          </option>
                          {TIME_OPTIONS.map(opt => (
                            <option
                              key={`start-${opt.value}`}
                              value={opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="endTime"
                          className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                        >
                          End time
                        </label>
                        <select
                          id="endTime"
                          value={step1EndTime}
                          onChange={e => setStep1EndTime(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                        >
                          <option value="" disabled>
                            Select a time
                          </option>
                          {TIME_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="duration"
                          className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                        >
                          Duration (hours)
                        </label>
                        <input
                          id="duration"
                          type="number"
                          min={1}
                          placeholder="e.g. 2"
                          value={step1Duration}
                          onChange={e => setStep1Duration(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="groupSize"
                          className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                        >
                          Group size <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="groupSize"
                          type="number"
                          min={1}
                          placeholder="e.g. 20"
                          value={step1GroupSize}
                          onChange={e => setStep1GroupSize(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                        />
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
                      <input
                        id="location"
                        type="text"
                        placeholder="e.g. Downtown Winnipeg"
                        value={step1Location}
                        onChange={e => setStep1Location(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Q6 — Proposal deadline */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Hard deadline for proposal?{' '}
                    <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="eventDate"
                        className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1"
                      >
                        Date
                      </label>
                      <div className="relative">
                        <input
                          id="eventDate"
                          type="date"
                          value={step1EventDate}
                          onChange={e => setStep1EventDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-9 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      {state.fieldErrors?.eventDate && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {state.fieldErrors.eventDate}
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
                      <select
                        id="proposalTime"
                        value={step1ProposalTime}
                        onChange={e => setStep1ProposalTime(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white"
                      >
                        <option value="" disabled>
                          Select a time
                        </option>
                        {TIME_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
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
            {step === 2 && (
              <div className="p-6 flex flex-col gap-6">
                {leaderQuestions.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Team Personality Questions
                    </p>
                    {leaderQuestions.map((q, idx) => (
                      <div key={q.id ?? idx}>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          {q.text}
                        </p>
                        {q.description && (
                          <p className="text-[11px] text-gray-400 mb-2">
                            {q.description}
                          </p>
                        )}

                        {/* Single choice */}
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
                                  checked={memberAnswers[q.id!] === opt.value}
                                  onChange={() =>
                                    handleMemberAnswer(q.id!, opt.value, false)
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

                        {/* Multi choice */}
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

                        {/* Scale */}
                        {q.type === 'scale' && (
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() =>
                                  handleMemberAnswer(q.id!, String(n), false)
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

                        {/* Text input */}
                        {q.type === 'text_input' && (
                          <textarea
                            rows={3}
                            value={(memberAnswers[q.id!] as string) ?? ''}
                            onChange={e =>
                              handleMemberAnswer(q.id!, e.target.value, false)
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E91E8C] focus:bg-white resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No team questions configured. Click Next to continue.
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
            {step === 3 && (
              <div className="p-6 flex flex-col gap-6">
                {/* Individual invites */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Invite Individuals <span className="text-red-500">*</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Search by name or email, or paste multiple emails separated
                    by commas to invite several people at once.
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
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Invite Teams <span className="text-red-500">*</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mb-3">
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
          <div className="flex justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4 rounded-b-2xl shrink-0">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-[#E91E8C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c7177a]"
                >
                  Next →
                </button>
              </>
            ) : step === 2 ? (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-[#E91E8C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c7177a]"
                >
                  Next →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    onClick={handleSubmitClick}
                    className="rounded-lg bg-[#E91E8C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c7177a] disabled:opacity-60"
                  >
                    {pending ? 'Submitting…' : 'Submit Request →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
