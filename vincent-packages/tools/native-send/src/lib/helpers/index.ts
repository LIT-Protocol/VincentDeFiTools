/**
 * Helper functions for the native-send tool
 */

/**
 * Creates a personalized greeting message
 * @param message - The base message to include in the greeting
 * @param recipient - Optional recipient name (defaults to 'World')
 * @returns A formatted greeting string
 */
export function createHelloWorldGreeting(
  message: string,
  recipient?: string
): string {
  const target = recipient || "World";
  return `Hello, ${target}! ${message}`;
}

/**
 * Validates if a message is appropriate for greeting
 * @param message - The message to validate
 * @returns True if the message is valid
 */
export function isValidGreetingMessage(message: string): boolean {
  // Basic validation - no empty strings, reasonable length
  return message.trim().length > 0 && message.length <= 280;
}

/**
 * Formats a timestamp for display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
