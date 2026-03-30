import type { CSSProperties } from 'react';

export type EventCancellationTemplateProps = {
  recipientName: string;
  eventTitle: string;
  eventLocation: string;
  cancellationType: 'event' | 'date';
  canceledDateLabel?: string | null;
  canceledTimeLabel?: string | null;
};

const pageStyle: CSSProperties = {
  backgroundColor: '#f5f7fb',
  margin: 0,
  padding: '32px 16px',
  fontFamily: 'Arial, sans-serif',
  color: '#1f2937',
};

const cardStyle: CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  border: '1px solid #e5e7eb',
  padding: '32px',
  lineHeight: 1.6,
};

const eyebrowStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: '12px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#b91c1c',
  fontWeight: 700,
};

const titleStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: '28px',
  lineHeight: 1.2,
  color: '#111827',
};

const panelStyle: CSSProperties = {
  margin: '20px 0',
  padding: '16px 18px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '16px',
};

const footerStyle: CSSProperties = {
  marginTop: '28px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e7eb',
  fontSize: '12px',
  color: '#6b7280',
};

export function EventCancellationEmail(
  props: Readonly<EventCancellationTemplateProps>
) {
  const safeName = props.recipientName || 'there';
  const isDateCancellation = props.cancellationType === 'date';

  return (
    <html lang="en">
      <body style={pageStyle}>
        <div style={cardStyle}>
          <p style={eyebrowStyle}>Event Update</p>
          <h1 style={titleStyle}>
            {isDateCancellation
              ? 'An event date has been canceled'
              : 'This event has been canceled'}
          </h1>

          <p>Hi {safeName},</p>
          <p>
            {isDateCancellation
              ? 'One of the scheduled dates for an event you purchased is no longer available.'
              : 'An event you purchased has been canceled.'}
          </p>

          <div style={panelStyle}>
            <p style={{ margin: '0 0 8px' }}>
              Event: <strong>{props.eventTitle}</strong>
            </p>
            <p style={{ margin: '0 0 8px' }}>
              Location: <strong>{props.eventLocation}</strong>
            </p>
            {isDateCancellation && props.canceledDateLabel ? (
              <p style={{ margin: '0 0 8px' }}>
                Canceled date: <strong>{props.canceledDateLabel}</strong>
              </p>
            ) : null}
            {isDateCancellation && props.canceledTimeLabel ? (
              <p style={{ margin: 0 }}>
                Time: <strong>{props.canceledTimeLabel}</strong>
              </p>
            ) : null}
          </div>

          <p>
            Our team will follow up if any further action is needed regarding
            your booking.
          </p>

          <div style={footerStyle}>
            This message was sent automatically because a booking-related event
            update affected your purchase.
          </div>
        </div>
      </body>
    </html>
  );
}
