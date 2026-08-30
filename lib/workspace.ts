/**
 * Legacy workspace field (Phase 2/3).
 *
 * Phase 4.5 retires the four-business workspace concept from the product: there
 * is no switcher, no workspace dashboards, and no workspace navigation. The
 * `workspace` column stays on projects/tasks/notes/assets/content/workflows
 * because touching the schema is a Phase 6 migration concern — so this type
 * survives purely to keep those writes type-safe.
 *
 * Nothing in the UI reads or displays it any more. New records are written with
 * DEFAULT_WORKSPACE until the Phase 6 migration drops the column.
 */
export type Workspace = "shared-os" | "clothing-brand" | "ai-cinematic" | "money-gap";

export const DEFAULT_WORKSPACE: Workspace = "shared-os";
