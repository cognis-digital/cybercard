/**
 * Core data model for a security quick-reference card.
 *
 * A card is a titled collection of sections. Each section holds an ordered
 * list of reference rows; each row is a {term, value} pair (for example
 * "Port 22" -> "SSH", or "Containment" -> "Isolate affected hosts").
 */

/** A single reference row: a term and its associated value/description. */
export interface CardRow {
  /** The lookup key, e.g. a port number, status code, or step name. */
  term: string;
  /** The associated value or description. */
  value: string;
  /** Optional extra note rendered as muted secondary text. */
  note?: string;
}

/** A named group of reference rows. */
export interface CardSection {
  /** Heading shown above the rows. */
  heading: string;
  /** Ordered reference rows in this section. */
  rows: CardRow[];
}

/** A complete card definition. */
export interface Card {
  /** Card title, shown prominently at the top. */
  title: string;
  /** Optional subtitle / context line below the title. */
  subtitle?: string;
  /** Optional footer line (e.g. attribution, version, revision date). */
  footer?: string;
  /** One or more sections of reference rows. */
  sections: CardSection[];
}

/** A single validation problem, with a dotted path to the offending field. */
export interface ValidationIssue {
  path: string;
  message: string;
}

/** Result of validating an unknown value against the Card schema. */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
