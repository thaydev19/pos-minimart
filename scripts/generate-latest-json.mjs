import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
const version = tauriConf.version;

const nsisDir = path.join(rootDir, "src-tauri", "target", "release", "bundle", "nsis");
const installerName = `lao-minimart-pos_${version}_x64-setup.exe`;
const sigPath = path.join(nsisDir, `${installerName}.sig`);
const latestJsonPath = path.join(nsisDir, "latest.json");

if (!fs.existsSync(sigPath)) {
  console.warn(
    `[generate-latest-json] Signature file not found at ${sigPath}. Skipping latest.json generation.`
  );
  process.exit(0);
}

const signature = fs.readFileSync(sigPath, "utf8").trim();
const latestManifest = {
  version,
  notes: `Cap nhat Lao Minimart POS v${version}`,
  pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  platforms: {
    "windows-x86_64": {
      signature,
      url: `https://github.com/thaydev19/pos-minimart/releases/download/v${version}/${installerName}`,
    },
  },
};

fs.writeFileSync(latestJsonPath, JSON.stringify(latestManifest, null, 2) + "\n", "utf8");
console.log(`[generate-latest-json] Generated ${latestJsonPath} for v${version}`);
