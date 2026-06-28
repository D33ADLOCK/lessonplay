/**
 * Turn a station id into a short caption. Handles both plain and camelCase ids:
 *
 *   "mixture"    → "Mixture"
 *   "acetoneJar" → "Acetone jar"
 *
 * A space is inserted before each interior capital, the whole thing is
 * lower-cased, then the first letter is capitalised — so a multi-word id reads as
 * a single sentence-case caption.
 */
export function titleCase(id: string): string {
  const spaced = id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
