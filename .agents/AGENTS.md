# Project-Scoped Rules

- **Live Testing Preference**: Focus more on live testing in the production/staging Vercel environment rather than exclusively relying on the local dev server. This project uses Vercel Serverless Functions and Upstash Redis, which behave significantly differently from a local Node.js process (e.g., ephemeral memory resets, KV store latency, edge function limits). Verify features on the live URL to catch environmental edge cases early.
