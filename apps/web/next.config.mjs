/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ['@portfolio/core', '@portfolio/db'],

  /*
   * Next 16.3 writes an AGENTS.md and a CLAUDE.md into this directory on every
   * dev run. This repository already has an authoritative CLAUDE.md at the root
   * and vendored skills pinned by skills-lock.json, so a generated second set
   * of agent instructions is both churn and a competing source of truth.
   */
  agentRules: false,
};
