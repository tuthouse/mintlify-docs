// docs-oracle — keeps docs.agnt.social in step with what tut announces.
//
// Source: agnt.social's founder oracle (GET /api/founder-oracle), the same distilled fact
// sheet every AGNT agent and the Discord bot answer from. When facts change, the model works out
// which pages they affect and rewrites those pages IN PLACE: fix the stale line, keep the
// structure, components and voice, add a section only when nothing fits. Nothing publishes on
// its own — the workflow opens a PR that tut merges.
//
// Every rewritten page must pass the guards below or it is dropped and listed in the PR as
// needing a human. The run also writes the facts it handled to state.json, so a merged PR
// becomes the new baseline.
//
// Env: OPENAI_API_KEY (required), DOCS_ORACLE_MODEL (optional), ORACLE_URL (optional), GITHUB_OUTPUT / RUNNER_TEMP (Actions).

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd(); // the docs repo root
const HERE = path.join(ROOT, ".github", "docs-oracle");
const STATE_FILE = path.join(HERE, "state.json");
const ORACLE_URL = process.env.ORACLE_URL || "https://agnt.social/api/founder-oracle";
// Cheap on purpose: runs weekly on a handful of short pages, and every edit is guarded + reviewed.
const MODEL = process.env.DOCS_ORACLE_MODEL || "gpt-5-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_PAGES_PER_RUN = 6;


// ─── Inputs ──────────────────────────────────────────────────────────────────

async function fetchFacts() {
  const res = await fetch(ORACLE_URL, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "agnt-docs-oracle" } });
  if (!res.ok) throw new Error(`oracle HTTP ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body?.facts)) throw new Error("oracle returned no facts array");
  return body.facts
    .filter((f) => typeof f?.fact === "string" && f.fact.trim())
    .map((f) => ({ fact: f.fact.trim(), since: String(f.since || "") }));
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return { facts: [] }; }
}

/** Every page in docs.json's navigation, with its MDX source. */
function readPages() {
  const nav = JSON.parse(fs.readFileSync(path.join(ROOT, "docs.json"), "utf8")).navigation;
  const slugs = [];
  (function walk(n) {
    if (typeof n === "string") slugs.push(n);
    else if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") Object.values(n).forEach(walk);
  })(nav);
  return [...new Set(slugs)]
    .map((slug) => ({ slug, file: path.join(ROOT, `${slug}.mdx`) }))
    .filter((p) => fs.existsSync(p.file))
    .map((p) => ({ ...p, source: fs.readFileSync(p.file, "utf8") }));
}

const STYLE = (() => {
  try { return fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8"); } catch { return ""; }
})();

// ─── Guards ──────────────────────────────────────────────────────────────────

const LINK_HOSTS = new Set(["agnt.social", "docs.agnt.social", "mint.agnt.social"]);
const COMPONENTS = ["Tip", "Note", "Warning", "Info", "Check", "Card", "CardGroup", "Steps", "Step", "Accordion", "AccordionGroup", "Tabs", "Tab", "Update", "Frame", "CodeGroup"];

const urls = (s) => new Set((s.match(/https?:\/\/[^\s)<>"'`\]]+/gi) || []).map((u) => u.replace(/[.,;:!?]+$/, "")));
const addrs = (s) => new Set((s.match(/0x[0-9a-fA-F]{20,}/g) || []).map((a) => a.toLowerCase()));

function allowedUrl(u) {
  try {
    const x = new URL(u);
    if (x.protocol !== "https:") return false;
    const h = x.hostname.toLowerCase();
    if (h === "x.com" || h === "twitter.com") return /^\/agntsocial(\/|$)/i.test(x.pathname);
    return LINK_HOSTS.has(h);
  } catch { return false; }
}

/** Returns a reason string when the rewrite must be dropped, or null when it's safe. */
function rejectReason(before, after) {
  const fm = (s) => (s.match(/^---\n[\s\S]*?\n---\n/) || [""])[0];
  if (!fm(after)) return "frontmatter missing";
  const title = (s) => (fm(s).match(/^title:.*$/m) || [""])[0];
  if (title(before) !== title(after)) return "page title changed";

  const oldUrls = urls(before);
  const badUrl = [...urls(after)].find((u) => !oldUrls.has(u) && !allowedUrl(u));
  if (badUrl) return `new non-AGNT link: ${badUrl}`;

  const oldAddrs = addrs(before);
  const newAddr = [...addrs(after)].find((a) => !oldAddrs.has(a));
  if (newAddr) return `new contract address introduced: ${newAddr}`;

  for (const c of COMPONENTS) {
    const open = (after.match(new RegExp(`<${c}(\\s[^>]*)?(?<!/)>`, "g")) || []).length;
    const close = (after.match(new RegExp(`</${c}>`, "g")) || []).length;
    if (open !== close) return `unbalanced <${c}> (${open} open, ${close} close)`;
  }

  const ratio = after.length / Math.max(1, before.length);
  if (ratio < 0.6 || ratio > 1.8) return `size changed too much (${Math.round(ratio * 100)}% of original)`;
  const beforeLines = new Set(before.split("\n"));
  const afterLines = after.split("\n");
  const changed = afterLines.filter((l) => l.trim() && !beforeLines.has(l)).length;
  if (changed > Math.max(12, afterLines.length * 0.6)) return `rewrote too much (${changed} of ${afterLines.length} lines changed)`;
  if (/TODO|As an AI|\[insert/i.test(after) && !/TODO|As an AI|\[insert/i.test(before)) return "placeholder text in output";
  return null;
}

// ─── Model calls (OpenAI) ─────────────────────────────────────────────────────

async function openai(system, user, { json = null } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    signal: AbortSignal.timeout(300000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "medium",
      max_completion_tokens: 32000,
      ...(json ? { response_format: { type: "json_schema", json_schema: { name: "plan", strict: true, schema: json } } } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const choice = (await res.json())?.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error("model ran out of room");
  if (choice?.message?.refusal) throw new Error("model refused");
  return choice?.message?.content || "";
}

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["edits", "skipped"],
  properties: {
    edits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["page", "why", "facts"],
        properties: {
          page: { type: "string", description: "page slug exactly as listed, e.g. agnts/burns" },
          why: { type: "string", description: "one sentence: what is stale or missing on this page" },
          facts: { type: "array", items: { type: "string" }, description: "the facts (verbatim) this edit applies" },
        },
      },
    },
    skipped: {
      type: "array",
      description: "new or changed facts that belong on no page, with why",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["fact", "reason"],
        properties: { fact: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
};

async function plan(pages, added, removed, current) {
  const catalog = pages.map((p) => `### PAGE ${p.slug}\n${p.source}`).join("\n\n");
  const raw = await openai(`You maintain docs.agnt.social, the public documentation for AGNT. The founder's official
announcements have changed. Decide which existing pages must change so the docs stay accurate.

- Prefer fixing pages that are now WRONG or STALE (say "not live yet" for something now live,
  old dates, superseded plans) over adding new information.
- Add a fact to a page only if it clearly belongs to that page's topic and a reader of that page
  would want it. User-facing product facts only.
- Skip fast-moving counts (users, burned, activated, holders) unless the page already states that
  number — then update it. Skip internal/dev chatter, hype, and anything not useful to a user.
- A removed fact means the founder no longer says it; correct pages that still rely on it only if
  a current fact contradicts them.
- At most ${MAX_PAGES_PER_RUN} pages. Use page slugs exactly as listed.`,
    `NEW OR CHANGED FACTS:\n${added.map((f) => `- (${f.since}) ${f.fact}`).join("\n") || "(none)"}\n\n`
        + `NO LONGER STATED:\n${removed.map((f) => `- ${f}`).join("\n") || "(none)"}\n\n`
        + `ALL CURRENT FACTS (context, newest first):\n${current.map((f) => `- (${f.since}) ${f.fact}`).join("\n")}\n\n`
        + `DOCS PAGES:\n\n${catalog}`,
    { json: PLAN_SCHEMA });
  try { return JSON.parse(raw); } catch { throw new Error("planner returned no parsable plan"); }
}

async function rewrite(page, edit, current) {
  const text = await openai(`You edit one page of docs.agnt.social (Mintlify MDX) so it matches the founder's latest
official facts. Edit IN PLACE, like a careful human editor:

- Change only what the facts require. Fix the stale sentence where it is; don't append a
  changelog, don't add "Update:" notes, don't restate facts the page already covers.
- Keep the frontmatter, title, headings, order, Mintlify components (<Tip>, <Note>, <Warning>,
  <Card>, <Steps>…) and the page's voice. Add a short new section only when no existing section fits.
- Never add links except to agnt.social, docs.agnt.social, mint.agnt.social or x.com/agntsocial.
  Never add contract addresses. No price talk, predictions or financial advice.
- Follow the style guide below.

Return ONLY the complete updated file, starting with the frontmatter "---". No commentary, no code fence.

STYLE GUIDE:
${STYLE}`,
    `WHAT TO CHANGE: ${edit.why}\n\nFACTS TO APPLY:\n${edit.facts.map((f) => `- ${f}`).join("\n")}\n\n`
        + `ALL CURRENT FACTS (for consistency):\n${current.map((f) => `- (${f.since}) ${f.fact}`).join("\n")}\n\n`
        + `PAGE ${page.slug}.mdx:\n${page.source}`);
  // Tolerate a stray code fence around the file.
  const body = text.trim().replace(/^```(?:mdx|md|markdown)?\n/, "").replace(/\n```$/, "");
  return body.endsWith("\n") ? body : `${body}\n`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  console.log(`${key}=${value}`);
}

async function main() {
  const current = await fetchFacts();
  const baseline = new Set((readState().facts || []).map((f) => f.fact));
  const now = new Set(current.map((f) => f.fact));
  const added = current.filter((f) => !baseline.has(f.fact));
  const removed = [...baseline].filter((f) => !now.has(f));
  console.log(`facts: ${current.length} current, ${added.length} new/changed, ${removed.length} no longer stated`);
  if (!added.length && !removed.length) { output("changed", "false"); return; }

  const pages = readPages();
  const bySlug = new Map(pages.map((p) => [p.slug, p]));
  const result = await plan(pages, added, removed, current);
  const edited = [];
  const rejected = [];

  for (const edit of result.edits.slice(0, MAX_PAGES_PER_RUN)) {
    const page = bySlug.get(edit.page.replace(/\.mdx$/, "").replace(/^\//, ""));
    if (!page) { rejected.push({ ...edit, reason: "no such page" }); continue; }
    try {
      const after = await rewrite(page, edit, current);
      if (after === page.source) { rejected.push({ ...edit, reason: "no change produced" }); continue; }
      const reason = rejectReason(page.source, after);
      if (reason) { rejected.push({ ...edit, reason }); continue; }
      fs.writeFileSync(page.file, after);
      page.source = after; // a later edit to the same page builds on this one
      edited.push(edit);
      console.log(`edited ${page.slug}: ${edit.why}`);
    } catch (e) {
      rejected.push({ ...edit, reason: e.message });
    }
  }

  fs.writeFileSync(STATE_FILE, `${JSON.stringify({ facts: current }, null, 2)}\n`);

  const lines = ["Automated from tut's latest announcements (the same facts agnt.social agents and the Discord bot answer from). Review the diff, then merge to publish.", ""];
  if (edited.length) {
    lines.push("### Pages updated");
    for (const e of edited) lines.push(`- **\`${e.page}\`**: ${e.why}`, ...e.facts.map((f) => `  - _${f}_`));
    lines.push("");
  }
  if (rejected.length) {
    lines.push("### Needs a human (edit was dropped)");
    for (const e of rejected) lines.push(`- \`${e.page}\`: ${e.why}. **Dropped:** ${e.reason}`);
    lines.push("");
  }
  if (result.skipped.length) {
    lines.push("<details><summary>New facts left out of the docs</summary>", "");
    for (const s of result.skipped) lines.push(`- ${s.fact}: ${s.reason}`);
    lines.push("", "</details>", "");
  }
  if (removed.length) {
    lines.push("<details><summary>No longer stated by tut</summary>", "", ...removed.map((f) => `- ${f}`), "", "</details>", "");
  }
  lines.push("🤖 Generated by docs-oracle");
  const bodyFile = path.join(process.env.RUNNER_TEMP || HERE, "pr-body.md");
  fs.writeFileSync(bodyFile, lines.join("\n"));

  output("changed", "true");
  output("pages", String(edited.length));
  output("body_file", bodyFile);
}

export { rejectReason, readPages, fetchFacts };

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => {
  console.error(`docs-oracle failed: ${e.stack || e.message}`);
  process.exit(1);
});
