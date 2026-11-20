#!/usr/bin/env node
// PostToolUse hook: run Prettier on any file Claude just wrote or edited.
// Respects .prettierignore (e.g. .hai/) and skips file types Prettier doesn't know.
import { execFileSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;

const file = JSON.parse(input || '{}').tool_input?.file_path;
if (!file) process.exit(0);

try {
  execFileSync('pnpm', ['exec', 'prettier', '--write', '--ignore-unknown', file], {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    stdio: ['ignore', 'ignore', 'pipe']
  });
} catch (err) {
  // Don't block the edit; surface the problem to Claude instead.
  process.stderr.write(`prettier failed on ${file}:\n${err.stderr ?? err.message}`);
  process.exit(1);
}
