const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function passwordError(password: string): string | undefined {
  if (!password) return 'Enter a password';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}
