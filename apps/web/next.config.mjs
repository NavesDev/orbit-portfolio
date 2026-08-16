import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/*
 * The workspace's single `.env`, loaded here because Next looks for one beside
 * `next.config.mjs` and this repository keeps one at the root — which is what
 * `@portfolio/db` already reads through `--env-file-if-exists=../../.env`.
 * Without this, `pnpm dev` and `pnpm db:migrate` would disagree about what the
 * environment is.
 *
 * Optional by design: a checkout with no `.env` still builds, and a variable
 * already set in the real environment (Vercel, CI) wins over the file.
 */
const workspaceEnv = fileURLToPath(new URL('../../.env', import.meta.url));

if (existsSync(workspaceEnv)) {
  process.loadEnvFile(workspaceEnv);
}

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ['@portfolio/core', '@portfolio/db', '@portfolio/infra'],

  /*
   * Next 16.3 writes an AGENTS.md and a CLAUDE.md into this directory on every
   * dev run. This repository already has an authoritative CLAUDE.md at the root
   * and vendored skills pinned by skills-lock.json, so a generated second set
   * of agent instructions is both churn and a competing source of truth.
   */
  agentRules: false,
};
