import * as React from 'react';

export interface EventCreatedEmailProps {
  recipientName: string;
  eventTitle: string;
  eventLocation: string;
  eventLink: string;
}

export function EventCreatedEmail({
  recipientName,
  eventTitle,
  eventLocation,
  eventLink,
}: EventCreatedEmailProps) {
  return (
    <div
      style={{ fontFamily: 'Arial, sans-serif', color: '#222', padding: 24 }}
    >
      <h2>Hi {recipientName},</h2>
      <p>
        A new event <b>{eventTitle}</b> has been created!
      </p>
      <p>
        <b>Location:</b> {eventLocation}
      </p>
      <p>
        We look forward to your participation. Please check the event details in
        your dashboard.
      </p>
      <div style={{ margin: '32px 0' }}>
        <a
          href={eventLink}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#6366f1',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16,
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Event
        </a>
      </div>
      <p style={{ marginTop: 32 }}>
        Best regards,
        <br />
        The Popcolab Team
      </p>
    </div>
  );
}

export default EventCreatedEmail;
