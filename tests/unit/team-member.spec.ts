import { getTeamMemberNameLine } from '@/utils/team-member';

describe('getTeamMemberNameLine', () => {
  test('uses first and last name when both are present', () => {
    expect(
      getTeamMemberNameLine({
        name: 'johnny',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      })
    ).toBe('John, Doe');
  });

  test('falls back to computed name when either name part is missing', () => {
    expect(
      getTeamMemberNameLine({
        name: 'johnny',
        firstName: null,
        lastName: 'Doe',
        email: 'john@example.com',
      })
    ).toBe('johnny');
  });

  test('keeps placeholder behavior when no usable name is available', () => {
    expect(
      getTeamMemberNameLine({
        name: '   ',
        firstName: null,
        lastName: null,
        email: 'john@example.com',
      })
    ).toBe('—, —');
  });
});
