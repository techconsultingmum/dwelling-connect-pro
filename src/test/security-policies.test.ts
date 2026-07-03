import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Guardrail: the SECURITY DEFINER RPCs `has_role` and `get_chat_partners` MUST
// remain executable by the `authenticated` role. RLS policies on public tables
// and the chat directory RPC depend on these grants; a migration that revokes
// them would silently break auth and messaging.

function loadMigrations(): string {
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  return files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n\n");
}

const sql = loadMigrations();
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

describe("security policies (static)", () => {
  it("grants EXECUTE on has_role to authenticated", () => {
    expect(normalized).toMatch(
      /grant execute on function public\.has_role[^;]*to[^;]*authenticated/,
    );
  });

  it("grants EXECUTE on get_chat_partners to authenticated", () => {
    expect(normalized).toMatch(
      /grant execute on function public\.get_chat_partners[^;]*to[^;]*authenticated/,
    );
  });

  it("enables RLS on every core public table", () => {
    for (const table of [
      "profiles",
      "user_roles",
      "notices",
      "complaints",
      "messages",
      "maintenance_payments",
      "society_settings",
    ]) {
      expect(normalized).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`),
      );
    }
  });

  it("never grants ALL on user_roles to anon or authenticated (must go via has_role)", () => {
    expect(normalized).not.toMatch(
      /grant all on public\.user_roles to (anon|authenticated)/,
    );
  });
});