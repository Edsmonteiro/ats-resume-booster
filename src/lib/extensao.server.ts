/** Helpers server-only para os tokens da extensão do navegador. */

export function gerarToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const dados = new TextEncoder().encode(`eupasso:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Lê o token do header Authorization: Bearer <token>. */
export function tokenDoHeader(request: Request): string | null {
  const bruto = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/i.exec(bruto.trim());
  return match?.[1] ?? null;
}
