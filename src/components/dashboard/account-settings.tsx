'use client';

import { UserProfile } from '@clerk/nextjs';

export default function AccountSettings() {
  return <UserProfile routing="hash" />;
}
