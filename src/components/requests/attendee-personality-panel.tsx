'use client';

import type { RequestAttendeesSummary } from '@/services/request-attendee-service';

const INVITE_STATUS_MAP = {
  accepted: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Declined', className: 'bg-red-100 text-red-600' },
};

type Props = {
  summary: RequestAttendeesSummary;
};

export default function AttendeePersonalityPanel({ summary }: Props) {
  const { attendees, dominantPersonality } = summary;

  if (attendees.length === 0) return null;

  const withPersonality = attendees.filter(a => a.personality !== null).length;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
          Attendees ({attendees.length})
        </p>
        {withPersonality > 0 && (
          <p className="text-[9px] text-gray-400">
            {withPersonality} of {attendees.length} have personality data
          </p>
        )}
      </div>

      {/* Dominant personality banner */}
      {dominantPersonality && (
        <div
          className="rounded-lg px-3 py-2 flex items-center gap-2"
          style={{
            backgroundColor: dominantPersonality.accentColor
              ? `${dominantPersonality.accentColor}18`
              : 'rgb(243 244 246)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: dominantPersonality.accentColor
              ? `${dominantPersonality.accentColor}40`
              : 'rgb(229 231 235)',
          }}
        >
          <span className="text-xl leading-none">
            {dominantPersonality.emoji}
          </span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500">
              Group dominant personality
            </p>
            <p className="text-xs font-bold text-gray-800">
              {dominantPersonality.name}
              <span className="ml-1.5 text-[10px] font-normal text-gray-500">
                ({dominantPersonality.count} of {attendees.length})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Attendee list */}
      <div className="flex flex-col gap-2">
        {attendees.map(attendee => {
          const statusMeta =
            INVITE_STATUS_MAP[attendee.inviteStatus] ??
            INVITE_STATUS_MAP.pending;

          return (
            <div
              key={attendee.email}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Avatar placeholder with emoji or initial */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
                  style={{
                    backgroundColor: attendee.personality?.accentColor
                      ? `${attendee.personality.accentColor}25`
                      : 'rgb(243 244 246)',
                  }}
                >
                  {attendee.personality?.emoji ? (
                    <span>{attendee.personality.emoji}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400">
                      {attendee.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {attendee.name}
                  </p>
                  {attendee.personality ? (
                    <p className="text-[10px] text-gray-500">
                      {attendee.personality.name}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">
                      No personality data yet
                    </p>
                  )}
                </div>
              </div>

              <span
                className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
