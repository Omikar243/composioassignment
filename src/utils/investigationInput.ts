/**
 * Resolve the source URL for a live investigation.
 * An explicit documentation URL override takes precedence; if it is blank,
 * a URL entered in the primary field is used as the source.
 */
export function resolveDocumentationSourceUrl(
  appInput: string,
  documentationUrlOverride: string
): string | undefined {
  const override = documentationUrlOverride.trim();
  if (override) return override;

  const primaryInput = appInput.trim();
  return /^https?:\/\//i.test(primaryInput) ? primaryInput : undefined;
}
