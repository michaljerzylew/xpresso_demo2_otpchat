import { CSP } from './csp';

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  FEATHERLESS_API_KEY?: string;
}

const DEFAULT_MODEL = 'Qwen/Qwen2.5-72B-Instruct';
const DEFAULT_KEY = 'rc_029ce8baff7510edc6c0dd91b54869434bf5dd098bd6d34254abaed2dad8c0e5';

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function deriveDisplayName(email: string): string {
  const local = email.split('@')[0];
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function deriveInitials(email: string): string {
  const userPart = email.split('@')[0];
  const parts = userPart.split('.').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // --- 0. Endpoint: Logout (/logout, /api/logout, /cdn-cgi/access/logout) ---
    if (pathname === '/logout' || pathname === '/api/logout' || pathname === '/cdn-cgi/access/logout') {
      const headers = new Headers();
      headers.set('Location', 'https://milkies.cloudflareaccess.com/cdn-cgi/access/logout');
      headers.append(
        'Set-Cookie',
        'CF_Authorization=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None'
      );
      headers.append(
        'Set-Cookie',
        'CF_AppSession=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None'
      );
      return new Response(null, {
        status: 302,
        headers,
      });
    }

    // --- 1. Endpoint: GET /api/me ---
    if (pathname === '/api/me') {
      if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const email =
        request.headers.get('cf-access-authenticated-user-email') ||
        request.headers.get('x-dev-user-email') ||
        'michaljerzylew@gmail.com';

      const jwt = request.headers.get('cf-access-jwt-assertion') || '';
      const claims = decodeJwtPayload(jwt);
      const displayName = deriveDisplayName(email);
      const initials = deriveInitials(email);
      const sub = (claims?.sub as string) || email;

      return new Response(
        JSON.stringify({
          authenticated: true,
          email,
          displayName,
          name: displayName,
          initials,
          userId: sub,
          provider: 'cloudflare_access_otp',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // --- 2. Endpoint: GET /api/models ---
    if (pathname === '/api/models') {
      if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const models = [
        {
          id: 'Qwen/Qwen2.5-72B-Instruct',
          name: 'Qwen 2.5 72B',
          badge: 'Default',
          description: 'Flagship open-weights model, excellent general reasoning and coding.',
          contextLength: 32768,
        },
        {
          id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
          name: 'Deep-Seek R1 70B',
          badge: 'Reasoning',
          description: 'Distilled reasoning model with explicit chain-of-thought outputs.',
          contextLength: 32768,
        },
        {
          id: 'zai-org/GLM-4.7-Flash',
          name: 'GLM 4.7 Flash',
          badge: 'Fast',
          description: 'Ultra-low latency model optimized for agile interactive dialogue.',
          contextLength: 32768,
        },
        {
          id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
          name: 'Llama 3.1 70B',
          badge: 'General',
          description: 'Premier Meta open foundation model with balanced capabilities.',
          contextLength: 131072,
        },
        {
          id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          name: 'Qwen 2.5 Coder 32B',
          badge: 'Coding',
          description: 'Specialized model for code generation and software debugging.',
          contextLength: 32768,
        },
      ];

      return new Response(JSON.stringify({ models }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // --- 3. Endpoint: POST /api/chat (Streaming Proxy to Featherless AI) ---
    if (pathname === '/api/chat' || pathname === '/api/chat/completions') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: { message: 'Method Not Allowed', type: 'invalid_request_error' } }), {
          status: 405,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const apiKey = env.FEATHERLESS_API_KEY || DEFAULT_KEY;

      let payload: any;
      try {
        payload = await request.json();
      } catch {
        return new Response(
          JSON.stringify({
            error: { message: 'Invalid JSON request body', type: 'invalid_request_error' },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      }

      if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
        return new Response(
          JSON.stringify({
            error: { message: 'The messages array is required and must not be empty.', type: 'invalid_request_error' },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      }

      if (!payload.model) {
        payload.model = DEFAULT_MODEL;
      }
      payload.stream = true;

      // Upstream request to Featherless AI
      let upstreamResponse: Response;
      try {
        upstreamResponse = await fetch('https://api.featherless.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'xpresso-otpchat/1.0.0', // Mitigate Cloudflare WAF bot blocking
          },
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            error: { message: `Featherless connection failed: ${err.message}`, type: 'upstream_error' },
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      }

      if (!upstreamResponse.ok) {
        const errText = await upstreamResponse.text();
        return new Response(errText, {
          status: upstreamResponse.status,
          headers: {
            'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
          },
        });
      }

      // Stream SSE body directly to client
      return new Response(upstreamResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // --- 4. Static Assets & SPA Fallback ---
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('Content-Security-Policy', CSP);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    const type = response.headers.get('Content-Type');
    if (pathname === '/sw.js') {
      response.headers.set('Cache-Control', 'no-cache');
      response.headers.set('Service-Worker-Allowed', '/');
    } else if (pathname === '/manifest.webmanifest') {
      response.headers.set('Content-Type', 'application/manifest+json; charset=utf-8');
      response.headers.set('Cache-Control', 'no-cache');
    } else if (
      response.status === 200 &&
      /^\/assets\/.+-[\w-]{8,}\.[\w]+$/.test(pathname) &&
      !type?.includes('text/html')
    ) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (response.status === 200 && pathname.startsWith('/pwa/')) {
      response.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    } else if (type?.includes('text/html')) {
      response.headers.set('Cache-Control', 'no-cache');
    }

    return response;
  },
};
