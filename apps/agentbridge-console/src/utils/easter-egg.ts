/**
 * Easter Egg Cookie Utilities
 * Simple detection of the easter egg cookie set when users click the rocket
 */

const COOKIE_NAME = "agentpass_rocket_launched";
const COOKIE_MAX_AGE = 86400000; // 24 hours in milliseconds

/**
 * Check if the easter egg cookie exists and is valid
 * @returns true if valid easter egg cookie exists
 */
export function checkEasterEggCookie(): boolean {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!cookieValue) return false;

  // Simple timestamp check (24 hours)
  const timestamp = parseInt(cookieValue, 10);
  return !isNaN(timestamp) && Date.now() - timestamp < COOKIE_MAX_AGE;
}

/**
 * Clear the easter egg cookie after use
 */
export function clearEasterEggCookie(): void {
  // Clear cookie across domains
  document.cookie = `${COOKIE_NAME}=; domain=.agentpass.ai; path=/; max-age=0`;
  // Also clear for localhost
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
