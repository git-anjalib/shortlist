export type AuthIntent = "sign-in" | "sign-up" | "resend-confirmation";
export type AuthFieldErrors = Partial<Record<"email" | "password", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHARACTERS = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

function hasSpecialCharacter(value: string) {
  return [...value].some((character) => SPECIAL_CHARACTERS.includes(character));
}

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

  if (intent === "sign-up") {
    const passwordLength = Array.from(password).length;
    const requirements: string[] = [];

    if (passwordLength < 8) {
      requirements.push("Use at least 8 characters.");
    } else if (passwordLength > 12) {
      requirements.push("Use no more than 12 characters.");
    }

    if (!/[0-9]/.test(password)) {
      requirements.push("Include at least one number.");
    }

    if (!hasSpecialCharacter(password)) {
      requirements.push("Include at least one special character, such as ! or #.");
    }

    if (requirements.length > 0) {
      errors.password = requirements.join(" ");
    }
  } else if (intent === "sign-in") {
    if (password.length < 8) {
      errors.password = "Use at least 8 characters.";
    } else if (password.length > 128) {
      errors.password = "Use no more than 128 characters.";
    }
  }

  return errors;
}
