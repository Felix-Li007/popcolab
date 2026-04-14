import * as React from 'react';

export interface ExperienceCreatedEmailProps {
  recipientName: string;
  experienceTitle: string;
  experienceCategory: string;
  experienceLink: string;
}

export function ExperienceCreatedEmail({
  recipientName,
  experienceTitle,
  experienceCategory,
  experienceLink,
}: ExperienceCreatedEmailProps) {
  return (
    <div
      style={{ fontFamily: 'Arial, sans-serif', color: '#222', padding: 24 }}
    >
      <h2>Hi {recipientName},</h2>
      <p>
        A new experience <b>{experienceTitle}</b> has been published!
      </p>
      <p>
        <b>Category:</b> {experienceCategory}
      </p>
      <div style={{ margin: '32px 0' }}>
        <a
          href={experienceLink}
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
          View Experience
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

export default ExperienceCreatedEmail;
