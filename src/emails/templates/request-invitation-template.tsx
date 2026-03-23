import type { CSSProperties } from 'react';

export type RequestInvitationTemplateProps = {
  inviteeName: string;
  requestCategory: string;
  inviteUrl: string;
};

const buttonStyle: CSSProperties = {
  display: 'inline-block',
  padding: '12px 18px',
  backgroundColor: '#0f766e',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '999px',
  fontWeight: 700,
};

const panelStyle: CSSProperties = {
  margin: '20px 0',
  padding: '16px 18px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
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
  color: '#0f766e',
  fontWeight: 700,
};

const titleStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: '28px',
  lineHeight: 1.2,
  color: '#111827',
};

const bodyStyle: CSSProperties = {
  fontSize: '15px',
};

const footerStyle: CSSProperties = {
  marginTop: '28px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e7eb',
  fontSize: '12px',
  color: '#6b7280',
};

export function RequestInvitationEmail(
  props: Readonly<RequestInvitationTemplateProps>
) {
  const safeName = props.inviteeName || 'there';

  return (
    <html lang="en">
      <body style={pageStyle}>
        <div style={cardStyle}>
          <p style={eyebrowStyle}>Request Invitation</p>
          <h1 style={titleStyle}>You&apos;re invited to join a request</h1>
          <div style={bodyStyle}>
            <p>Hi {safeName},</p>
            <p>You have been invited to join a request.</p>
            <div style={panelStyle}>
              <p style={{ margin: '0 0 8px' }}>
                Request category: <strong>{props.requestCategory}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Review the invitation and choose Accept or Reject from the page
                below.
              </p>
            </div>
            <p>
              <a href={props.inviteUrl} style={buttonStyle}>
                Review invitation
              </a>
            </p>
          </div>
          <div style={footerStyle}>
            If you accept and already have an account, you will be guided to
            sign in. If you do not have an account yet, you will be guided to
            sign up.
          </div>
        </div>
      </body>
    </html>
  );
}
