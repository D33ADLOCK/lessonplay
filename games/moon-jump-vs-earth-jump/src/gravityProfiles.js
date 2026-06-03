export const BUILT_IN_PROFILES = [
  {
    id: 'moon',
    name: 'Moon',
    objectName: 'Moon',
    gravity: 760,
    jumpVelocity: 820,
    color: '#f7f0bf',
    accent: '#7f8fb4',
    message: 'The Moon has gentle gravity, so jumps go very high and floating down takes longer.',
  },
  {
    id: 'earth',
    name: 'Earth',
    objectName: 'Earth',
    gravity: 1550,
    jumpVelocity: 690,
    color: '#63c7ff',
    accent: '#2f965a',
    message: 'Earth gravity is our everyday gravity, so the jump feels normal.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    objectName: 'Jupiter',
    gravity: 2550,
    jumpVelocity: 560,
    color: '#f2a35e',
    accent: '#9f4e2c',
    message: 'Jupiter has powerful gravity, so jumps stay small and the fall is quick.',
  },
];

export const DEFAULT_PROFILE = BUILT_IN_PROFILES[1];

export function createCustomProfile({ name, gravity, jumpVelocity, message }) {
  const cleanName = name.trim();

  return {
    id: `custom-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    name: cleanName,
    objectName: cleanName,
    gravity,
    jumpVelocity,
    color: '#ffd166',
    accent: '#1f9a8a',
    message: message.trim() || `${cleanName} has its own gravity, so the jump changes again.`,
    custom: true,
  };
}

export function validateCustomProfile({ name, gravity, jumpVelocity }) {
  if (!name.trim()) {
    return 'Give your gravity object a name.';
  }

  if (!Number.isFinite(gravity) || gravity < 300 || gravity > 3200) {
    return 'Gravity should be between 300 and 3200.';
  }

  if (!Number.isFinite(jumpVelocity) || jumpVelocity < 250 || jumpVelocity > 1000) {
    return 'Jump strength should be between 250 and 1000.';
  }

  return '';
}
