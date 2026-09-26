/**
 * Joins class names, skipping falsy values.
 * @param classes - class strings or conditional values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
