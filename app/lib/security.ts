/**
 * Security, Injection Defense, and Role Verification Module
 * Strictly enforces that ONLY 'admin@younus.com' can hold administrative privileges.
 * Any injection attempt or alternate email is forcibly downgraded to 'user'.
 */

// Common SQL Injection, XSS, and privilege bypass patterns
const INJECTION_PATTERNS = [
  /('|"|`)\s*(or|and)\s*('|"|`)?(\d+|\w+)('|"|`)?\s*=\s*('|"|`)?(\d+|\w+)/i, // ' OR '1'='1, " or 1=1
  /('|"|`)\s*(or|and)\s*true/i,                                              // ' OR true
  /(--|\/\*|\*\/|#|;)/,                                                       // SQL comment / statement terminator
  /\bunion\s+(all\s+)?select\b/i,                                             // UNION SELECT
  /\b(exec|execute|sp_executesql|xp_cmdshell)\b/i,                            // Stored procedures
  /\b(drop|truncate|alter|create)\s+table\b/i,                                // DDL injection
  /\b(sleep|benchmark|waitfor\s+delay)\s*\(/i,                                // Time-based injection
  /\bload_file\s*\(/i,                                                        // File access injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,                       // XSS injection
  /javascript\s*:/i,                                                          // JS protocol
  /role\s*[:=]\s*['"]?admin['"]?/i,                                          // Role parameter injection
];

/**
 * Detects whether an input string exhibits known SQL, XSS, or privilege injection patterns.
 */
export function detectInjectionAttempt(...inputs: (string | null | undefined)[]): boolean {
  for (const input of inputs) {
    if (!input || typeof input !== "string") continue;
    const trimmed = input.trim();
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Normalizes user role.
 * STRICT POLICY: Under NO circumstances can any user other than 'admin@younus.com'
 * ever be granted or maintain the 'admin' role. All others receive 'user'.
 */
export function normalizeUserRole(email?: string | null, attemptedRole?: string | null): "admin" | "user" {
  if (!email) return "user";
  const cleanEmail = email.trim().toLowerCase();

  // If injection attempt was detected or email does not match canonical admin
  if (cleanEmail === "admin@younus.com") {
    return "admin";
  }

  // Any other email or payload attempting "admin" is forcibly downgraded to "user"
  return "user";
}

/**
 * Verifies if a given user object possesses legitimate canonical admin privileges.
 */
export function isCanonicalAdmin(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user || !user.email) return false;
  const cleanEmail = user.email.trim().toLowerCase();
  return cleanEmail === "admin@younus.com" && user.role === "admin";
}
