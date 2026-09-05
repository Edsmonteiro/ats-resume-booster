import "./lib/error-capture";

import { describeError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function requestContext(request: Request, requestId: string) {
  let pathname = "/";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    // Não inclui a URL bruta nos logs para evitar vazar query strings/tokens.
  }
  return { requestId, method: request.method, pathname };
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// h3 pode converter throws internos em um 500 JSON genérico. Nessa situação não
// reutilizamos um erro global compartilhado entre requisições: em concorrência isso
// poderia associar o erro de um usuário a outra requisição. Registramos apenas contexto
// não sensível e devolvemos a página de erro estável.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
  requestId: string,
): Promise<Response> {
  if (response.status < 500) return withRequestId(response, requestId);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return withRequestId(response, requestId);

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return withRequestId(response, requestId);

  console.error("[SSR] Resposta 500 não tratada", {
    ...requestContext(request, requestId),
    responseType: "h3_unhandled",
  });
  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-request-id": requestId,
    },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = crypto.randomUUID();
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response, request, requestId);
    } catch (error) {
      console.error("[SSR] Falha catastrófica", {
        ...requestContext(request, requestId),
        error: describeError(error),
      });
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-request-id": requestId,
        },
      });
    }
  },
};
