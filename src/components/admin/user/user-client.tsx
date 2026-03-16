'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import UserCard from '@/components/admin/user/user-card';
import type {
  AdminUserEditableUpdateInput,
  AdminUserListItem,
} from '@/types/user-type';
import styles from '@/styles/admin/users/user-content.module.css';

const UserViewModal = dynamic(
  () => import('@/components/admin/user/user-view'),
  { ssr: false }
);
const UserEditModal = dynamic(
  () => import('@/components/admin/user/user-edit'),
  { ssr: false }
);

type Props = {
  users: AdminUserListItem[];
};

function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  userName: string,
  email: string
): string {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || userName || email.split('@')[0] || 'Unknown User';
}

function mergeEditableUserUpdate(
  user: AdminUserListItem,
  payload: AdminUserEditableUpdateInput
): AdminUserListItem {
  const updatedUser = {
    ...user,
    userName: payload.userName,
    status: payload.status,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phoneNumber: payload.phoneNumber,
    preferredContact: payload.preferredContact,
    corporateName: payload.corporateName,
    departmentName: payload.departmentName,
    roleTitle: payload.roleTitle,
    workMode: payload.workMode,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...updatedUser,
    displayName: buildDisplayName(
      updatedUser.firstName,
      updatedUser.lastName,
      updatedUser.userName,
      updatedUser.email
    ),
  };
}

export default function UserClient({ users }: Props) {
  const [localUsers, setLocalUsers] = useState(users);
  const [viewUser, setViewUser] = useState<AdminUserListItem | null>(null);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  return (
    <>
      <div className={styles.grid}>
        {localUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onViewDetails={nextUser => {
              setViewUser(nextUser);
              setEditUser(null);
            }}
            onEdit={nextUser => {
              setEditUser(nextUser);
              setViewUser(null);
            }}
          />
        ))}
      </div>

      <UserViewModal
        user={viewUser}
        isOpen={viewUser !== null}
        onClose={() => {
          setViewUser(null);
        }}
      />

      <UserEditModal
        user={editUser}
        isOpen={editUser !== null}
        onUserUpdated={(userId, payload) => {
          setLocalUsers(prev =>
            prev.map(user =>
              user.id === userId ? mergeEditableUserUpdate(user, payload) : user
            )
          );

          setViewUser(prev =>
            prev && prev.id === userId
              ? mergeEditableUserUpdate(prev, payload)
              : prev
          );
          setEditUser(prev =>
            prev && prev.id === userId
              ? mergeEditableUserUpdate(prev, payload)
              : prev
          );
        }}
        onClose={() => {
          setEditUser(null);
        }}
      />
    </>
  );
}
