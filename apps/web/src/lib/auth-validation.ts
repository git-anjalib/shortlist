export type AuthIntent = "sign-in" | "sign-up" | "resend-confirmation";
export type AuthFieldErrors = Partial<Record<"email" | "password", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthCredentials({
  email,
  password,
  intent,
}: {
  email: string;
  password: string;
  intent: AuthIntent;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = "Enter your email address.";
  } else if (
    normalizedEmail.length > 254 ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (intent !== "resend-confirmation") {
    if (password.length < 8) {
      errors.password = "Use at least 8 characters.";
    } else if (password.length > 128) {
      errors.password = "Use no more than 128 characters.";
    }
  }

  return errors;
}
