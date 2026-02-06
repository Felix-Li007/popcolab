'use client';
// TODO: This is demo component for testing purposes, not intended for production use.
import { useAuth, useUser } from '@clerk/nextjs';

export const ClientComponent = () => {
  // Get the authentication state and user information using Clerk's hooks
  const { isSignedIn, sessionId, userId } = useAuth();
  // Get the user object and check if it's loaded
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Sign in to view this page</div>;
  }
  return <div>Hello {user.firstName}!</div>;
};
export default ClientComponent;
