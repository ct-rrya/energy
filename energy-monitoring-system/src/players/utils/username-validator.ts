/**
 * Username validation and sanitization utility for EcoStep guest players.
 */

// Reserved keywords that cannot be used as player usernames
const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'superadmin',
  'system',
  'systemadmin',
  'root',
  'moderator',
  'ecostep',
  'ecostepadmin',
  'official',
  'support',
  'help',
  'guest',
  'anonymous',
  'null',
  'undefined',
]);

// Basic inappropriate words filter
const INAPPROPRIATE_PATTERNS = [
  /fuck/i,
  /shit/i,
  /bitch/i,
  /asshole/i,
  /nigger/i,
  /nigga/i,
  /faggot/i,
  /cunt/i,
  /whore/i,
  /slut/i,
  /dick/i,
  /pussy/i,
  /bastard/i,
  /retard/i,
];

export interface UsernameValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

export function validateUsername(username: string): UsernameValidationResult {
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      normalized: '',
      error: 'Username is required',
    };
  }

  const trimmed = username.trim();
  const normalized = trimmed.toLowerCase();

  // Length check: 3 - 20 chars
  if (trimmed.length < 3) {
    return {
      isValid: false,
      normalized,
      error: 'Username must be at least 3 characters long',
    };
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      normalized,
      error: 'Username cannot exceed 20 characters',
    };
  }

  // Allowed characters: letters, numbers, underscores, hyphens
  const validCharRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validCharRegex.test(trimmed)) {
    return {
      isValid: false,
      normalized,
      error: 'Username can only contain letters, numbers, underscores (_), and hyphens (-)',
    };
  }

  // Must contain at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      isValid: false,
      normalized,
      error: 'Username must contain at least one letter or number',
    };
  }

  // Reserved keyword check
  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      isValid: false,
      normalized,
      error: 'This username is reserved and cannot be chosen',
    };
  }

  // Inappropriate content check
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isValid: false,
        normalized,
        error: 'Username contains inappropriate or prohibited language',
      };
    }
  }

  return {
    isValid: true,
    normalized,
  };
}
