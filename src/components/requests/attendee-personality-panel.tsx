'use client';

import type { RequestAttendeesSummary } from '@/services/request-attendee-service';
import { Badge } from '@/ui';

const INVITE_STATUS_MAP = {
  accepted: { label: 'Accepted', variant: 'success' as const },
  pending: { label: 'Pending', variant: 'warning' as const },
  rejected: { label: 'Declined', variant: 'danger' as const },
};

type Props = {
  summary: RequestAttendeesSummary;
};

export default function AttendeePersonalityPanel({ summary }: Props) {
  const { attendees, dominantPersonality } = summary;

  if (attendees.length === 0) return null;

  const withPersonality = attendees.filter(a => a.personality !== null).length;

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-white/70 pt-4">
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
          className="rounded-[1.35rem] px-3.5 py-2.5 flex items-center gap-2.5 shadow-[0_14px_26px_rgba(236,72,153,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl"
          style={{
            background: dominantPersonality.accentColor
              ? `linear-gradient(135deg, ${dominantPersonality.accentColor}14, rgba(255,255,255,0.7))`
              : 'linear-gradient(135deg, rgba(243,244,246,0.9), rgba(255,255,255,0.72))',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: dominantPersonality.accentColor
              ? `${dominantPersonality.accentColor}40`
              : 'rgb(229 231 235)',
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
            style={{
              background: dominantPersonality.accentColor
                ? `linear-gradient(180deg, rgba(255,255,255,0.76), ${dominantPersonality.accentColor}24)`
                : 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,244,246,0.92))',
            }}
          >
            <span className="text-lg leading-none">
              {dominantPersonality.emoji}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">
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
              className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/60 bg-white/34 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Avatar placeholder with emoji or initial */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]"
                  style={{
                    background: attendee.personality?.accentColor
                      ? `linear-gradient(180deg, rgba(255,255,255,0.74), ${attendee.personality.accentColor}24)`
                      : 'linear-gradient(180deg, rgba(255,255,255,0.84), rgb(243 244 246))',
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

              <Badge size="xs" variant={statusMeta.variant}>
                {statusMeta.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
