export type RequestStatusChangedTemplateProps = {
  recipientName: string;
  requestId: number;
  objectiveCategory: string;
  previousStatus: string | null;
  nextStatus: string;
};

function formatStatusLabel(value: string | null) {
  if (!value) return null;
  return value.toLowerCase().replaceAll('_', ' ');
}

export function RequestStatusChangedEmail(
  props: Readonly<RequestStatusChangedTemplateProps>
) {
  const safeName = props.recipientName || 'there';
  const previousStatusLabel = formatStatusLabel(props.previousStatus);
  const nextStatusLabel =
    formatStatusLabel(props.nextStatus) ?? props.nextStatus;

  return (
    <html lang="en">
      <body>
        <div>
          <p>Request Update</p>
          <h1>Your request status has changed</h1>

          <p>Hi {safeName},</p>
          <p>Your request status has been updated in Pop CoLab.</p>

          <div>
            <p>
              Request ID: <strong>#{props.requestId}</strong>
            </p>
            <p>
              Objective category: <strong>{props.objectiveCategory}</strong>
            </p>
            {previousStatusLabel ? (
              <p>
                Previous status: <strong>{previousStatusLabel}</strong>
              </p>
            ) : null}
            <p>
              Current status: <strong>{nextStatusLabel}</strong>
            </p>
          </div>

          <p>
            You can review your request details and related updates in your
            dashboard.
          </p>

          <div>This is an automated message from Pop CoLab.</div>
        </div>
      </body>
    </html>
  );
}
