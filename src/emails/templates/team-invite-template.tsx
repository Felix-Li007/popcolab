import type { CSSProperties } from 'react';

export type TeamInviteTemplateProps = {
  inviteeName: string;
  teamName: string;
  inviterName: string;
  joinUrl: string;
};

const buttonStyle: CSSProperties = {
  display: 'inline-block',
  padding: '12px 18px',
  backgroundColor: '#E91E8C',
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
  color: '#E91E8C',
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

type Props = TeamInviteTemplateProps;

export function TeamInviteEmail(props: Props) {
  const safeName = props.inviteeName || 'there';

  return (
    <html>
      <body style={pageStyle}>
        <div style={cardStyle}>
          <p style={eyebrowStyle}>Team Invitation</p>
          <h1 style={titleStyle}>You&apos;ve been invited to join a team</h1>
          <div style={bodyStyle}>
            <p>Hi {safeName},</p>
            <p>
              <strong>{props.inviterName}</strong> has invited you to join their
              team on Pop CoLab.
            </p>
            <div style={panelStyle}>
              <p style={{ margin: '0 0 8px' }}>
                Team: <strong>{props.teamName}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Click the button below to accept or decline the invitation.
              </p>
            </div>
            <p>
              <a href={props.joinUrl} style={buttonStyle}>
                View invitation
              </a>
            </p>
          </div>
          <div style={footerStyle}>
            If you already have a Pop CoLab account, you will be guided to sign
            in. If you don&apos;t have an account yet, you will be guided to
            sign up first.
          </div>
        </div>
      </body>
    </html>
  );
}
