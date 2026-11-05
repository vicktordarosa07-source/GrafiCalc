export function showWorkspaceReturnLink(access: string | string[] | undefined): boolean {
  return access !== "restrito" && !(Array.isArray(access) && access.includes("restrito"));
}
