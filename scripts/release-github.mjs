import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO = "thaydev19/pos-minimart";
const GH_USER = "thaydev19";
const rootDir = process.cwd();

function resolveGhBin() {
  const inPath = spawnSync("gh", ["--version"], { stdio: "ignore", shell: true });
  if (inPath.status === 0) return "gh";
  const defaultWinPath = "C:\\Program Files\\GitHub CLI\\gh.exe";
  if (fs.existsSync(defaultWinPath)) return `"${defaultWinPath}"`;
  return null;
}

const GH_BIN = resolveGhBin();
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const packageJsonPath = path.join(rootDir, "package.json");
const tauriConfRaw = fs.readFileSync(tauriConfPath, "utf8");
const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
const tauriConf = JSON.parse(tauriConfRaw);
const packageJson = JSON.parse(packageJsonRaw);
const prevVersion = tauriConf.version;

function bumpPatchVersion(ver) {
  const parts = String(ver).trim().split(".");
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
    throw new Error(`Invalid semver version in tauri.conf.json: "${ver}"`);
  }
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  const patch = Number(parts[2]) + 1;
  return `${major}.${minor}.${patch}`;
}

const version = bumpPatchVersion(prevVersion);
const tag = `v${version}`;

// 1. Auto-load signing private key from ~/.tauri/pos-minimart.key if not set
if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
  const defaultKeyPath = path.join(os.homedir(), ".tauri", "pos-minimart.key");
  if (!fs.existsSync(defaultKeyPath)) {
    console.error(`[release] Signing key not found at ${defaultKeyPath}`);
    process.exit(1);
  }
  process.env.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(defaultKeyPath, "utf8");
  console.log(`[release] Loaded signing key from ${defaultKeyPath}`);
}

// 2. Verify GitHub CLI (gh) is installed and logged in before spending time building
if (!GH_BIN) {
  console.error(
    "[release] Chua cai GitHub CLI (gh). Hay chay 2 lenh nay 1 lan duy nhat:\n" +
      "  winget install GitHub.cli\n" +
      "  gh auth login"
  );
  process.exit(1);
}

const ghAuth = spawnSync(GH_BIN, ["auth", "status"], { stdio: "ignore", shell: true });
if (ghAuth.status !== 0) {
  console.error("[release] Chua dang nhap GitHub CLI. Hay chay: gh auth login");
  process.exit(1);
}

// 2b. Ensure the active gh account matches GH_USER (safe when multiple accounts exist)
const ghSwitch = spawnSync(GH_BIN, ["auth", "switch", "--user", GH_USER], {
  stdio: "inherit",
  shell: true,
});
if (ghSwitch.status !== 0) {
  console.error(
    `[release] Khong chuyen duoc sang tai khoan GitHub '${GH_USER}'. Hay chay: gh auth login`
  );
  process.exit(1);
}

// 3. Bump patch version in tauri.conf.json & package.json, then build
tauriConf.version = version;
packageJson.version = version;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n", "utf8");
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
console.log(`[release] Auto-bumped version: ${prevVersion} -> ${version}`);

console.log(`[release] Building Lao Minimart POS ${tag}...`);
try {
  execSync("npm run build:exe", { stdio: "inherit", env: process.env });
} catch (err) {
  // Roll back version files if build fails so failed builds do not skip versions
  fs.writeFileSync(tauriConfPath, tauriConfRaw, "utf8");
  fs.writeFileSync(packageJsonPath, packageJsonRaw, "utf8");
  console.error(`[release] Build failed. Reverted version back to ${prevVersion}.`);
  throw err;
}

const nsisDir = path.join(rootDir, "src-tauri", "target", "release", "bundle", "nsis");
const installerPath = path.join(nsisDir, `lao-minimart-pos_${version}_x64-setup.exe`);
const latestJsonPath = path.join(nsisDir, "latest.json");

if (!fs.existsSync(installerPath) || !fs.existsSync(latestJsonPath)) {
  console.error("[release] Missing installer or latest.json after build.");
  process.exit(1);
}

// 4. Create or update GitHub Release and upload both files
const checkRelease = spawnSync(GH_BIN, ["release", "view", tag, "--repo", REPO], {
  stdio: "ignore",
  shell: true,
});

if (checkRelease.status === 0) {
  console.log(`[release] Release ${tag} already exists. Uploading updated assets...`);
  execSync(
    `${GH_BIN} release upload "${tag}" "${installerPath}" "${latestJsonPath}" --repo "${REPO}" --clobber`,
    { stdio: "inherit" }
  );
} else {
  console.log(`[release] Creating GitHub Release ${tag} and uploading assets...`);
  execSync(
    `${GH_BIN} release create "${tag}" "${installerPath}" "${latestJsonPath}" --repo "${REPO}" --title "${tag}" --notes "Cap nhat Lao Minimart POS ${tag}"`,
    { stdio: "inherit" }
  );
}

console.log(`[release] Done! Release ${tag} is live at https://github.com/${REPO}/releases/tag/${tag}`);
