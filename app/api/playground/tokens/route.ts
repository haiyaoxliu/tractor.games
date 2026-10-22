// Dev-only API behind the playground's token panel: GET reads app/tokens.css,
// POST rewrites token values in place so a save is an ordinary, reviewable
// diff of that file. Returns 404 outside `next dev`.

import { promises as fs } from "fs";
import path from "path";
import { parseTokens, applyTokenValues } from "@/lib/tokensFile";

export const dynamic = "force-dynamic";

const TOKENS_PATH = path.join(process.cwd(), "app", "tokens.css");

function devOnly() {
  return process.env.NODE_ENV === "development"
    ? null
    : new Response("Not found", { status: 404 });
}

export async function GET() {
  const blocked = devOnly();
  if (blocked) return blocked;
  const css = await fs.readFile(TOKENS_PATH, "utf8");
  return Response.json({ tokens: parseTokens(css) });
}

export async function POST(request: Request) {
  const blocked = devOnly();
  if (blocked) return blocked;
  const body = (await request.json()) as { values?: Record<string, string> };
  const css = await fs.readFile(TOKENS_PATH, "utf8");
  let next: string;
  try {
    next = applyTokenValues(css, body.values ?? {});
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
  if (next !== css) await fs.writeFile(TOKENS_PATH, next);
  return Response.json({ tokens: parseTokens(next) });
}
