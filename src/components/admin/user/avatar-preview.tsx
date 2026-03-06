import type { AdminUserListItem } from '@/types/user-type';
import styles from '@/styles/avatar-preview.module.css';

type Props = {
  user: AdminUserListItem;
};

function getUserName(user: AdminUserListItem): string {
  return user.userName.trim() || 'No username';
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function getAvatarText(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '?';
  return normalized.slice(0, 1).toUpperCase();
}

export default function UserAvatarPreview({ user }: Props) {
  const userName = getUserName(user);
  const avatarText = getAvatarText(userName);
  const showAvatarImage = hasText(user.avatarImage);

  return (
    <div
      className={styles.avatarPlaceholder}
      aria-hidden="true"
      style={
        showAvatarImage
          ? { backgroundImage: `url(${user.avatarImage})` }
          : undefined
      }
    >
      {showAvatarImage ? (
        <span className={styles.avatarFallback}>{avatarText}</span>
      ) : (
        avatarText
      )}
    </div>
  );
}
