jest.mock('@/actions/profile-actions', () => ({
  updateProfileAction: jest.fn(),
}));

jest.mock('@/components/shared/company-info', () => ({
  __esModule: true,
  default: function MockCompanyProfile() {
    return <div data-testid="company-profile">Company form</div>;
  },
}));

jest.mock('@/components/dashboard/profile/profile-card', () => ({
  __esModule: true,
  default: function MockProfileCard({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) {
    return (
      <section>
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </section>
    );
  },
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { updateProfileAction } from '@/actions/profile-actions';
import ProfileContent from '@/components/dashboard/profile/profile-content';
import ProfileForm from '@/components/dashboard/profile/profile-form';

const updateProfileActionMock = updateProfileAction as jest.MockedFunction<
  typeof updateProfileAction
>;

const profileData = {
  profileId: 99,
  userId: 42,
  email: 'owner@example.com',
  userName: 'fengar',
  firstName: 'Feng',
  lastName: 'Li',
  phoneNumber: '204-555-0100',
  preferredContact: 'email',
  shortBio: 'Original short bio',
  consentGiven: false,
  privacyNotes: 'Original privacy notes',
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-02T00:00:00.000Z'),
} as const;

describe('profile components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ProfileForm submits edited values and shows a success message', async () => {
    updateProfileActionMock.mockResolvedValue({ success: true });

    render(<ProfileForm data={profileData} />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Fiona' },
    });
    fireEvent.change(screen.getByLabelText(/short bio/i), {
      target: { value: 'Updated short bio' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /consent given/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(updateProfileActionMock).toHaveBeenCalledWith({
        userName: 'fengar',
        firstName: 'Fiona',
        lastName: 'Li',
        phoneNumber: '204-555-0100',
        preferredContact: 'email',
        shortBio: 'Updated short bio',
        consentGiven: true,
        privacyNotes: 'Original privacy notes',
      })
    );

    expect(
      await screen.findByText(/profile saved successfully/i)
    ).toBeVisible();
  });

  test('ProfileForm shows an error when saving fails', async () => {
    updateProfileActionMock.mockResolvedValue({
      success: false,
      error: 'Failed to save profile. Please try again.',
    });

    render(<ProfileForm data={profileData} />);

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(
      await screen.findByText(/failed to save profile\. please try again\./i)
    ).toBeVisible();
  });

  test('ProfileContent renders both profile sections when profile data is available', () => {
    render(<ProfileContent profileData={profileData} companyData={null} />);

    expect(
      screen.getByRole('heading', { name: /personal information/i })
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: /company information/i })
    ).toBeVisible();
    expect(screen.getByTestId('company-profile')).toBeVisible();
  });

  test('ProfileContent shows an empty state when profile data is missing', () => {
    render(<ProfileContent profileData={null} companyData={null} />);

    expect(screen.getByText(/could not load profile data\./i)).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: /personal information/i })
    ).not.toBeInTheDocument();
  });
});
