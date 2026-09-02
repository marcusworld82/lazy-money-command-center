export type PermissionMode = "always" | "ask" | "never";
export function decidePermission(permissions: Record<string, unknown>, action: string): PermissionMode { const value = permissions[action]; return value === "always" || value === "never" || value === "ask" ? value : "ask"; }
