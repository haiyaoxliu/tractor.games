// Read and rewrite app/tokens.css for the design playground. Edits replace
// values on their existing lines, so comments, order and formatting survive
// and a save shows up as a minimal diff.

export interface Token {
  group: string;
  name: string;
  value: string;
}

const GROUP_RE = /^\s*\/\*\s*@group\s+(.+?)\s*\*\/\s*$/;
const TOKEN_RE = /^(\s*)(--[a-z0-9-]+)(\s*:\s*)(.+?);(\s*)$/;

export function parseTokens(css: string): Token[] {
  const tokens: Token[] = [];
  let group = "Other";
  for (const line of css.split("\n")) {
    const g = line.match(GROUP_RE);
    if (g) {
      group = g[1];
      continue;
    }
    const t = line.match(TOKEN_RE);
    if (t) tokens.push({ group, name: t[2], value: t[4] });
  }
  return tokens;
}

// A value may not end the declaration or open a block, so a save can only
// ever change token values.
function checkValue(name: string, value: string) {
  if (!value.trim() || value.length > 400 || /[;{}<>\n\r]/.test(value) || value.includes("/*")) {
    throw new Error(`Invalid value for ${name}: ${JSON.stringify(value)}`);
  }
}

export function applyTokenValues(css: string, values: Record<string, string>): string {
  const known = new Set(parseTokens(css).map((t) => t.name));
  for (const [name, value] of Object.entries(values)) {
    if (!known.has(name)) throw new Error(`Unknown token ${name}`);
    checkValue(name, value);
  }
  return css
    .split("\n")
    .map((line) => {
      const t = line.match(TOKEN_RE);
      if (!t || !Object.hasOwn(values, t[2])) return line;
      return `${t[1]}${t[2]}${t[3]}${values[t[2]].trim()};${t[5]}`;
    })
    .join("\n");
}
