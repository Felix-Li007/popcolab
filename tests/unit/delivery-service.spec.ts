jest.mock('@/services/resend-service', () => ({
  sendResendEmail: jest.fn(),
}));

jest.mock('@/emails/templates/event-cancel-template', () => ({
  EventCancellationEmail: jest.fn(props => ({
    type: 'mock-email-template',
    props,
  })),
}));

import { processNotificationQueueJob } from '@/services/delivery-service';
import { EventCancellationEmail } from '@/emails/templates/event-cancel-template';
import { sendResendEmail } from '@/services/resend-service';
import { NOTIFICATION_QUEUE_JOB_TYPE } from '@/types/queue-job';

const sendResendEmailMock = sendResendEmail as jest.MockedFunction<
  typeof sendResendEmail
>;
const eventCancellationEmailMock =
  EventCancellationEmail as jest.MockedFunction<typeof EventCancellationEmail>;

describe('delivery-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_FROM_EMAIL = 'noreply@popcolab.dev';
    sendResendEmailMock.mockResolvedValue({ id: 'email_1' });
  });

  test('processNotificationQueueJob builds and sends an event cancellation email payload', async () => {
    await processNotificationQueueJob({
      type: NOTIFICATION_QUEUE_JOB_TYPE.EVENT_CANCELED_EMAIL,
      recipientEmail: 'member@example.com',
      recipientName: 'Member One',
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      queuedAt: '2026-03-30T12:00:00.000Z',
    });

    expect(eventCancellationEmailMock).toHaveBeenCalledWith({
      recipientName: 'Member One',
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      cancellationType: 'event',
    });
    expect(sendResendEmailMock).toHaveBeenCalledWith({
      to: 'member@example.com',
      from: 'noreply@popcolab.dev',
      subject: 'Event canceled: Spring Gala',
      react: {
        type: 'mock-email-template',
        props: {
          recipientName: 'Member One',
          eventTitle: 'Spring Gala',
          eventLocation: 'Main Hall',
          cancellationType: 'event',
        },
      },
    });
  });

  test('processNotificationQueueJob builds and sends a date cancellation email payload', async () => {
    await processNotificationQueueJob({
      type: NOTIFICATION_QUEUE_JOB_TYPE.EVENT_DATE_CANCELED_EMAIL,
      recipientEmail: 'member@example.com',
      recipientName: 'Member One',
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      canceledDateLabel: 'Apr 5, 2026',
      canceledTimeLabel: '18:00 - 20:00',
      queuedAt: '2026-03-30T12:00:00.000Z',
    });

    expect(eventCancellationEmailMock).toHaveBeenCalledWith({
      recipientName: 'Member One',
      eventTitle: 'Spring Gala',
      eventLocation: 'Main Hall',
      cancellationType: 'date',
      canceledDateLabel: 'Apr 5, 2026',
      canceledTimeLabel: '18:00 - 20:00',
    });
    expect(sendResendEmailMock).toHaveBeenCalledWith({
      to: 'member@example.com',
      from: 'noreply@popcolab.dev',
      subject: 'Event date canceled: Spring Gala',
      react: {
        type: 'mock-email-template',
        props: {
          recipientName: 'Member One',
          eventTitle: 'Spring Gala',
          eventLocation: 'Main Hall',
          cancellationType: 'date',
          canceledDateLabel: 'Apr 5, 2026',
          canceledTimeLabel: '18:00 - 20:00',
        },
      },
    });
  });
});
