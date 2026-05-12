import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

function loadPostHogEnvFile() {
  const envPath = path.join(process.cwd(), ".env.posthog.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadPostHogEnvFile();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
