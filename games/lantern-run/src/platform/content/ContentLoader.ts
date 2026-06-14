/**
 * Generic content loading + validation.
 *
 * Levels, story beats, reactions and feedback are stored as validated,
 * serializable data (PRD "Content Contract"). This module provides the
 * engine-neutral validation primitive: a validator turns unknown data into a
 * typed value or a list of actionable developer errors. Slice 4 (#14) supplies
 * the concrete level validator and the valid/invalid fixtures.
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ValidationError[] };

export type Validator<T> = (input: unknown) => ValidationResult<T>;

export function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

export function fail<T>(errors: readonly ValidationError[]): ValidationResult<T> {
  return { ok: false, errors };
}

/**
 * Load and validate a single content record, throwing an actionable developer
 * error if invalid (PRD acceptance: "Invalid content produces an actionable
 * developer error").
 */
export function loadContent<T>(raw: unknown, validate: Validator<T>, label = "content"): T {
  const result = validate(raw);
  if (!result.ok) {
    const detail = result.errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Invalid ${label}:\n${detail}`);
  }
  return result.value;
}
