import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { applyTokenValues, parseTokens } from "./tokensFile";

const ROOT = path.join(__dirname, "..");
const tokensCss = readFileSync(path.join(ROOT, "app", "tokens.css"), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(tsx?|css)$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
  });
}

describe("tokens file", () => {
  it("parses every token with its group", () => {
    const tokens = parseTokens(tokensCss);
    expect(tokens.length).toBeGreaterThan(50);
    expect(tokens.find((t) => t.name === "--accent")).toEqual({
      group: "Accent & signal",
      name: "--accent",
      value: "#4f46e5",
    });
    expect(new Set(tokens.map((t) => t.name)).size).toBe(tokens.length);
  });

  it("defines every var(--token) the app uses", () => {
    const defined = new Set(parseTokens(tokensCss).map((t) => t.name));
    const missing: string[] = [];
    for (const dir of ["app", "components", "lib"]) {
      for (const file of sourceFiles(path.join(ROOT, dir))) {
        if (file.includes(`${path.sep}playground${path.sep}`)) continue;
        for (const m of readFileSync(file, "utf8").matchAll(/var\((--[a-z0-9-]+)\)/g)) {
          if (!defined.has(m[1])) missing.push(`${path.relative(ROOT, file)}: ${m[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("applyTokenValues", () => {
  const css = ":root {\n  /* @group A */\n  --a: #fff;\n  --b: 1px 2px;\n}\n";

  it("changes only the value on the token's own line", () => {
    expect(applyTokenValues(css, { "--b": " 3px 4px " })).toBe(
      ":root {\n  /* @group A */\n  --a: #fff;\n  --b: 3px 4px;\n}\n"
    );
  });

  it("rejects unknown tokens and values that could escape the declaration", () => {
    expect(() => applyTokenValues(css, { "--nope": "1px" })).toThrow(/Unknown/);
    expect(() => applyTokenValues(css, { "--a": "red; } body { color: red" })).toThrow(/Invalid/);
    expect(() => applyTokenValues(css, { "--a": "" })).toThrow(/Invalid/);
  });
});
