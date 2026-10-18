"use client";

// Playground shell: a live token panel beside the gallery, which loads in
// phone- and/or desktop-width iframes so media queries behave as on a device.
// Token edits apply instantly to the frames; Save writes them to
// app/tokens.css through the dev-only API.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Token } from "@/lib/tokensFile";
import { SECTIONS } from "./sections";
import styles from "./playground.module.css";

const VIEWPORTS = {
  phone: { label: "Phone", width: 390 },
  desktop: { label: "Desktop", width: 1280 },
} as const;
type ViewMode = "phone" | "desktop" | "both";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function toPickerHex(value: string) {
  const v = value.trim();
  if (!HEX_RE.test(v)) return null;
  return v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v.toLowerCase();
}

export default function Shell() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading tokens…");
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<ViewMode>("both");
  const [only, setOnly] = useState("");
  const frames = useRef<Set<HTMLIFrameElement>>(new Set());

  const saved = useMemo(() => Object.fromEntries(tokens.map((t) => [t.name, t.value])), [tokens]);
  const changed = Object.keys(edits).filter((k) => edits[k] !== saved[k]);

  useEffect(() => {
    fetch("/api/playground/tokens")
      .then((r) => r.json())
      .then((d: { tokens: Token[] }) => {
        setTokens(d.tokens);
        setStatus(`${d.tokens.length} tokens from app/tokens.css`);
      })
      .catch((e) => setStatus(`Could not load tokens: ${e}`));
  }, []);

  // Push the current overrides into one frame (or all of them).
  const applyTo = useCallback(
    (frame: HTMLIFrameElement) => {
      const root = frame.contentDocument?.documentElement;
      if (!root) return;
      for (const t of tokens) {
        const v = edits[t.name];
        if (v !== undefined && v !== t.value) root.style.setProperty(t.name, v);
        else root.style.removeProperty(t.name);
      }
    },
    [tokens, edits]
  );

  useEffect(() => {
    frames.current.forEach(applyTo);
  }, [applyTo]);

  const frameRef = useCallback(
    (el: HTMLIFrameElement | null) => {
      if (!el) return;
      const set = frames.current;
      set.add(el);
      el.onload = () => applyTo(el);
      applyTo(el);
      return () => {
        set.delete(el);
      };
    },
    [applyTo]
  );

  const setValue = (name: string, value: string) => setEdits((e) => ({ ...e, [name]: value }));

  const save = async () => {
    const values = Object.fromEntries(changed.map((k) => [k, edits[k]]));
    setStatus("Saving…");
    const r = await fetch("/api/playground/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const d = await r.json();
    if (!r.ok) {
      setStatus(d.error ?? "Save failed");
      return;
    }
    setTokens(d.tokens);
    setEdits({});
    setStatus(`Saved ${changed.length} token${changed.length === 1 ? "" : "s"} to app/tokens.css — review with git diff`);
  };

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const out = new Map<string, Token[]>();
    for (const t of tokens) {
      const val = edits[t.name] ?? t.value;
      if (q && !t.name.includes(q) && !val.toLowerCase().includes(q) && !t.group.toLowerCase().includes(q)) continue;
      out.set(t.group, [...(out.get(t.group) ?? []), t]);
    }
    return [...out.entries()];
  }, [tokens, edits, filter]);

  const shown = view === "both" ? (["phone", "desktop"] as const) : ([view] as const);
  const src = `/playground/frame${only ? `?only=${only}` : ""}`;

  return (
    <div className={styles.shell}>
      <aside className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>tractor.games tokens</div>
          <div className={styles.panelActions}>
            <button className={`${styles.chromeBtn} ${styles.chromeBtnOn}`} onClick={save} disabled={changed.length === 0}>
              Save {changed.length > 0 ? `(${changed.length})` : ""}
            </button>
            <button className={styles.chromeBtn} onClick={() => setEdits({})} disabled={changed.length === 0}>
              Reset
            </button>
            <input
              className={styles.tokenInput}
              style={{ flex: 1, minWidth: 100, gridColumn: "auto" }}
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className={styles.panelStatus}>{status}</div>
        </div>
        <div className={styles.panelBody}>
          {groups.map(([group, list]) => (
            <div key={group} className={styles.group}>
              <div className={styles.groupTitle}>{group}</div>
              {list.map((t) => {
                const value = edits[t.name] ?? t.value;
                const hex = toPickerHex(value);
                const isChanged = value !== t.value;
                return (
                  <label key={t.name} className={styles.token}>
                    <span className={`${styles.tokenName} ${isChanged ? styles.tokenChanged : ""}`}>
                      {t.name}
                      {isChanged && (
                        <span title={`saved: ${t.value}`} onClick={(e) => { e.preventDefault(); setValue(t.name, t.value); }}>
                          ↺
                        </span>
                      )}
                    </span>
                    {hex && (
                      <input
                        type="color"
                        className={styles.tokenSwatch}
                        value={hex}
                        onChange={(e) => setValue(t.name, e.target.value)}
                      />
                    )}
                    <input
                      className={`${styles.tokenInput} ${hex ? "" : styles.tokenInputWide}`}
                      value={value}
                      spellCheck={false}
                      onChange={(e) => setValue(t.name, e.target.value)}
                    />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <div className={styles.stage}>
        <div className={styles.toolbar}>
          {(["phone", "desktop", "both"] as const).map((v) => (
            <button key={v} className={`${styles.chromeBtn} ${view === v ? styles.chromeBtnOn : ""}`} onClick={() => setView(v)}>
              {v === "both" ? "Both" : VIEWPORTS[v].label}
            </button>
          ))}
          <span className={styles.toolbarSep} />
          <button className={`${styles.chromeBtn} ${only === "" ? styles.chromeBtnOn : ""}`} onClick={() => setOnly("")}>
            Everything
          </button>
          {SECTIONS.map(([id, label]) => (
            <button key={id} className={`${styles.chromeBtn} ${only === id ? styles.chromeBtnOn : ""}`} onClick={() => setOnly(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className={styles.frames}>
          {shown.map((v) => (
            <div key={v} className={styles.frameWrap} style={{ width: VIEWPORTS[v].width + 2 }}>
              <div className={styles.frameLabel}>{VIEWPORTS[v].label} · {VIEWPORTS[v].width}px</div>
              <iframe
                ref={frameRef}
                className={styles.frame}
                src={src}
                title={`${VIEWPORTS[v].label} preview`}
                style={{ width: VIEWPORTS[v].width + 2 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
