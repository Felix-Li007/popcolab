export type RequestMatchedTemplateProps = {
  recipientName: string;
  requestId: number;
  objectiveCategory: string;
};

export function RequestMatchedEmail(
  props: Readonly<RequestMatchedTemplateProps>
) {
  const safeName = props.recipientName || 'there';

  return (
    <html lang="en">
      <body>
        <div>
          <p>Request Update</p>
          <h1>Your request has been approved</h1>

          <p>Hi {safeName},</p>
          <p>
            Great news. Your request has been approved by our team and moved to
            matched status.
          </p>

          <div>
            <p>
              Request ID: <strong>#{props.requestId}</strong>
            </p>
            <p>
              Objective category: <strong>{props.objectiveCategory}</strong>
            </p>
          </div>

          <p>
            You can review your request details and related proposal in your
            dashboard.
          </p>

          <div>This is an automated message from Pop CoLab.</div>
        </div>
      </body>
    </html>
  );
}
