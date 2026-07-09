export type AuthFieldErrors = {
  email?: string;
  password?: string;
  fullName?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return undefined;
}

export function validateFullName(fullName: string): string | undefined {
  const trimmed = fullName.trim();
  if (!trimmed) return "Full name is required.";
  if (trimmed.length < 2) return "Enter your full name.";
  return undefined;
}

export function validateLoginForm(email: string, password: string): AuthFieldErrors {
  return {
    email: validateEmail(email),
    password: password ? undefined : "Password is required.",
  };
}

export function validateSignupForm(
  email: string,
  password: string,
  fullName: string,
): AuthFieldErrors {
  return {
    email: validateEmail(email),
    password: validatePassword(password),
    fullName: validateFullName(fullName),
  };
}

export function validateResetPasswordForm(
  password: string,
  confirmPassword: string,
): AuthFieldErrors {
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { password: passwordError };
  }
  if (password !== confirmPassword) {
    return { confirmPassword: "Passwords do not match." };
  }
  return {};
}

export function hasFieldErrors(errors: AuthFieldErrors) {
  return Object.values(errors).some(Boolean);
}
