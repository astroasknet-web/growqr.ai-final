import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Private file storage (port of Portal\Storage). With NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set, files go to
 * Supabase Storage in private buckets, reached with the server-side service-role key, so nothing is ever public. Without them
 * files are kept on local disk under STORAGE_DIR (default ./storage), which is how development and tests run.
 * The PHP app's bucket names are kept ("resumes", "vault") so both apps read each other's files.
 */
const seen = new Set<string>();

const url = (): string => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = (): string => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const remote = (): boolean => url() !== "" && key() !== "";

const root = (): string => path.resolve(process.env.STORAGE_DIR ?? "storage");
function localPath(bucket: string, p: string): string {
  const safe = p.split("/").map((s) => s.replace(/[^\w.\-]/g, "_")).join("/");
  const folder = ({ vault: "abroad", resumes: "resumes" } as Record<string, string>)[bucket] ?? bucket.replace(/[^\w-]/g, "_");
  return path.join(root(), folder, safe);
}

const encodePath = (p: string): string => p.split("/").map(encodeURIComponent).join("/");

async function http(method: string, p: string, body?: Uint8Array | string, headers: Record<string, string> = {}): Promise<[number, Buffer]> {
  const k = key();
  try {
    const res = await fetch(url() + p, {
      method,
      body: body as BodyInit | undefined,
      headers: { apikey: k, ...(k.startsWith("sb_") ? {} : { Authorization: `Bearer ${k}` }), ...headers },
      signal: AbortSignal.timeout(30_000),
    });
    return [res.status, Buffer.from(await res.arrayBuffer())];
  } catch {
    return [0, Buffer.alloc(0)]; // never include the URL or key in an error
  }
}

async function ensureBucket(bucket: string): Promise<void> {
  if (seen.has(bucket)) return;
  seen.add(bucket);
  await http("POST", "/storage/v1/bucket", JSON.stringify({ id: bucket, name: bucket, public: false }), { "Content-Type": "application/json" });
}

/** Store (or replace) an object. */
export async function put(bucket: string, p: string, data: Uint8Array, mime = "application/octet-stream"): Promise<boolean> {
  if (!remote()) {
    try {
      const file = localPath(bucket, p);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, data);
      return true;
    } catch {
      return false;
    }
  }
  await ensureBucket(bucket);
  const [code] = await http("POST", `/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(p)}`, data, { "Content-Type": mime, "x-upsert": "true" });
  return code >= 200 && code < 300;
}

/** Read an object, or null when it does not exist. */
export async function get(bucket: string, p: string): Promise<Buffer | null> {
  if (!remote()) {
    try {
      return await fs.readFile(localPath(bucket, p));
    } catch {
      return null;
    }
  }
  // Ask the CDN in front of Storage for a fresh copy, so a deleted or replaced file is never served from its cache.
  const [code, body] = await http("GET", `/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(p)}`, undefined, { "Cache-Control": "no-cache" });
  return code === 200 ? body : null;
}

export async function remove(bucket: string, p: string): Promise<boolean> {
  if (!remote()) {
    try {
      await fs.unlink(localPath(bucket, p));
      return true;
    } catch (e) {
      return (e as NodeJS.ErrnoException).code === "ENOENT";
    }
  }
  const [code] = await http("DELETE", `/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(p)}`);
  return (code >= 200 && code < 300) || code === 404;
}
