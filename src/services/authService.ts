import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/initialTracks';

const STORAGE_KEY_USER = 'your_melody_user';

export const generateGuestAvatar = (seed: string): string => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=10b981,065f46,047857`;
};

export const createGuestUser = (customUsername?: string): UserProfile => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanUsername = customUsername
    ? customUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')
    : `guest_${randomSuffix}`;

  const finalUsername = cleanUsername.length >= 3 ? cleanUsername : `guest_${randomSuffix}`;

  return {
    id: `usr_guest_${Date.now()}_${randomSuffix}`,
    name: 'Guest Listener',
    username: finalUsername,
    email: `${finalUsername}@guest.internal`,
    avatarUrl: generateGuestAvatar(finalUsername),
    role: 'MEMBER',
    authProvider: 'guest',
    isGuest: true,
    storageUsedBytes: 0,
    storageQuotaBytes: 1024 * 1024 * 1024, // 1 GB Guest Sandbox
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
};

export const loadStoredUser = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) {
      return INITIAL_USER;
    }
    const parsed: UserProfile = JSON.parse(raw);
    // Purge deprecated dummy accounts (Alex Rivera, Elena Rostova, Marcus Chen)
    const isDummy =
      parsed.username === 'alexrivera' ||
      parsed.username === 'elenarostova' ||
      parsed.username === 'marcuschen' ||
      parsed.id === 'usr_c0mmun1ty_01' ||
      parsed.id === 'usr_c0mmun1ty_02' ||
      parsed.id === 'usr_c0mmun1ty_03' ||
      parsed.name === 'Alex Rivera' ||
      parsed.name === 'Elena Rostova' ||
      parsed.name === 'Marcus Chen';

    if (isDummy) {
      localStorage.removeItem(STORAGE_KEY_USER);
      return INITIAL_USER;
    }

    // Ensure backwards compatibility with stored profiles lacking username
    if (!parsed.username) {
      parsed.username = parsed.name
        ? parsed.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${parsed.id.slice(-4)}`
        : `guest_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load user from localStorage:', err);
    return INITIAL_USER;
  }
};

export const saveStoredUser = (user: UserProfile | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
};

export const validateUsername = (raw: string): { valid: boolean; message?: string; clean: string } => {
  const clean = raw.toLowerCase().trim().replace(/@/g, '');
  if (clean.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters', clean };
  }
  if (clean.length > 20) {
    return { valid: false, message: 'Username cannot exceed 20 characters', clean };
  }
  if (!/^[a-z0-9_]+$/.test(clean)) {
    return { valid: false, message: 'Only lowercase letters, numbers, and underscores are permitted', clean };
  }
  return { valid: true, clean };
};
