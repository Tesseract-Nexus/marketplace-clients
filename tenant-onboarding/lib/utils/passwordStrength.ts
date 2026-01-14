export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
  color: string;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: ['Enter a password'],
      color: 'text-gray-400',
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  // Determine strength
  let strength: PasswordStrength;
  let color: string;

  if (score <= 2) {
    strength = 'weak';
    color = 'text-red-500';
  } else if (score <= 3) {
    strength = 'fair';
    color = 'text-orange-500';
  } else if (score <= 4) {
    strength = 'good';
    color = 'text-yellow-500';
  } else {
    strength = 'strong';
    color = 'text-green-500';
  }

  return {
    strength,
    score,
    feedback: feedback.length > 0 ? feedback : ['Excellent password!'],
    color,
  };
}

export function getPasswordStrengthBarColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

export function getPasswordStrengthWidth(score: number): string {
  const percentage = (score / 6) * 100;
  return `${percentage}%`;
}
