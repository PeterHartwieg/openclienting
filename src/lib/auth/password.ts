// Single source of truth for the password policy. Imported by the login
// dialog, reset-password page, account page, and the setOrChangePassword
// server action so the rule is enforced identically on both sides.

export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}
