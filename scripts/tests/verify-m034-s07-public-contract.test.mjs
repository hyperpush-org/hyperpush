import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");
const helperPath = path.join(root, "scripts", "lib", "m034_public_surface_contract.py");
const installSh = fs.readFileSync(path.join(root, "website/docs/public/install.sh"), "utf8");
const installPs1 = fs.readFileSync(path.join(root, "website/docs/public/install.ps1"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "tools/editors/vscode-mesh/package.json"), "utf8");
const packageName = "snowdamiz/mesh-registry-proof";
const packageDescription = "Real registry publish/install proof fixture for M034 S01";
const scopedQuery = "snowdamiz%2Fmesh-registry-proof";

function runHelper(args) {
  return spawnSync("python3", [helperPath, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

function runHelperAsync(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [helperPath, ...args], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      resolve({ status: code, signal, stdout, stderr });
    });
  });
}

function mkTmpDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function writeFile(base, relativePath, content) {
  const target = path.join(base, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function copyRepoFile(base, relativePath) {
  writeFile(base, relativePath, fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function gettingStartedHtml() {
  return `<!doctype html><html><body>
    <a href="https://meshlang.dev/install.sh">https://meshlang.dev/install.sh</a>
    <a href="https://meshlang.dev/install.ps1">https://meshlang.dev/install.ps1</a>
    <code>meshc --version</code>
    <code>meshpkg --version</code>
  </body></html>`;
}

function toolingHtml() {
  return `<!doctype html><html><body>
    https://meshlang.dev/install.sh
    https://meshlang.dev/install.ps1
    packages.meshlang.dev
    deploy.yml
    deploy-services.yml
    authoritative-verification.yml
    release.yml
    extension-release-proof.yml
    publish-extension.yml
    https://meshlang.dev/docs/getting-started/
    https://meshlang.dev/docs/tooling/
    https://packages.meshlang.dev/packages/${packageName}
    https://packages.meshlang.dev/search?q=${scopedQuery}
    https://api.packages.meshlang.dev/api/v1/packages?search=${scopedQuery}
    .tmp/m034-s05/verify/candidate-tags.json
    .tmp/m034-s05/verify/remote-runs.json
    v&lt;Cargo version&gt;
    ext-v&lt;extension version&gt;
    <code>meshpkg --version</code>
    <pre>set -a && source .env && set +a && bash scripts/verify-m034-s05.sh</pre>
  </body></html>`;
}

function createPublicHttpRoot(t) {
  const tmpRoot = mkTmpDir(t, "verify-m034-s07-public-");
  writeFile(tmpRoot, "website/docs/public/install.sh", installSh);
  writeFile(tmpRoot, "website/docs/public/install.ps1", installPs1);
  return tmpRoot;
}

function startServer(t, handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      t.after(
        () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          })
      );
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("failed to resolve local test server address"));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
    server.on("error", reject);
  });
}

test("local-docs fails closed when a required tooling runbook marker is missing", (t) => {
  const tmpRoot = mkTmpDir(t, "verify-m034-s07-local-");
  for (const relativePath of [
    "README.md",
    "website/docs/docs/getting-started/index.md",
    "website/docs/docs/tooling/index.md",
    "website/docs/public/install.sh",
    "website/docs/public/install.ps1",
    "tools/editors/vscode-mesh/package.json",
  ]) {
    copyRepoFile(tmpRoot, relativePath);
  }

  const toolingPath = path.join(tmpRoot, "website/docs/docs/tooling/index.md");
  const toolingText = fs.readFileSync(toolingPath, "utf8").replace(".tmp/m034-s05/verify/remote-runs.json", "");
  fs.writeFileSync(toolingPath, toolingText);

  const result = runHelper(["local-docs", "--root", tmpRoot]);
  assert.notEqual(result.status, 0, "local-docs should fail when a required marker is missing");
  assert.match(result.stderr, /website\/docs\/docs\/tooling\/index\.md missing '.tmp\/m034-s05\/verify\/remote-runs\.json'/);
});

test("built-docs fails closed when built installers drift from the source installers", (t) => {
  const tmpRoot = mkTmpDir(t, "verify-m034-s07-built-");
  writeFile(tmpRoot, "website/docs/public/install.sh", installSh);
  writeFile(tmpRoot, "website/docs/public/install.ps1", installPs1);
  writeFile(tmpRoot, "website/docs/.vitepress/dist/install.sh", installSh.replace("#!/bin/sh", "#!/bin/sh\n# stale"));
  writeFile(tmpRoot, "website/docs/.vitepress/dist/install.ps1", installPs1);
  writeFile(tmpRoot, "website/docs/.vitepress/dist/docs/getting-started/index.html", gettingStartedHtml());
  writeFile(tmpRoot, "website/docs/.vitepress/dist/docs/tooling/index.html", toolingHtml());

  const distRoot = path.join(tmpRoot, "website/docs/.vitepress/dist");
  const result = runHelper(["built-docs", "--root", tmpRoot, "--dist-root", distRoot]);
  assert.notEqual(result.status, 0, "built-docs should fail when a built installer drifts from source");
  assert.match(result.stderr, /built .*install\.sh drifted from .*website\/docs\/public\/install\.sh/);
});

test("public-http retries stale bytes until the shared contract turns green", async (t) => {
  const tmpRoot = createPublicHttpRoot(t);
  const artifactDir = path.join(tmpRoot, "artifacts");
  const counters = { installSh: 0 };
  const { baseUrl } = await startServer(t, (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");

    if (url.pathname === "/install.sh") {
      counters.installSh += 1;
      res.writeHead(200, { "Content-Type": "application/x-sh" });
      res.end(counters.installSh < 3 ? "#!/bin/sh\necho stale\n" : installSh);
      return;
    }
    if (url.pathname === "/install.ps1") {
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      res.end(installPs1);
      return;
    }
    if (url.pathname === "/docs/getting-started/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(gettingStartedHtml());
      return;
    }
    if (url.pathname === "/docs/tooling/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(toolingHtml());
      return;
    }
    if (url.pathname === `/packages/${packageName}`) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<html><body>${packageName} ${packageDescription}</body></html>`);
      return;
    }
    if (url.pathname === "/search" && url.search === `?q=${scopedQuery}`) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<html><body><h1>Results for <span>"${packageName}"</span></h1><p>${packageName}</p><p>${packageDescription}</p></body></html>`
      );
      return;
    }
    if (url.pathname === "/api/v1/packages" && url.search === `?search=${scopedQuery}`) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{ name: packageName, description: packageDescription }]));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`unhandled route: ${url.pathname}${url.search}`);
  });

  const result = await runHelperAsync([
    "public-http",
    "--root",
    tmpRoot,
    "--artifact-dir",
    artifactDir,
    "--site-base-url",
    baseUrl,
    "--packages-site-base-url",
    baseUrl,
    "--registry-base-url",
    baseUrl,
    "--retry-attempts",
    "3",
    "--retry-sleep-seconds",
    "0",
    "--fetch-timeout-seconds",
    "5",
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(counters.installSh, 3, "helper should retry until the stale installer bytes turn green");

  const publicLog = fs.readFileSync(path.join(artifactDir, "public-http.log"), "utf8");
  assert.match(publicLog, /attempt\t1\/3/);
  assert.match(publicLog, /attempt\t3\/3/);
  assert.match(publicLog, /final\tpassed\tattempt 3\/3/);
});

test("public-http fails with the last mismatch reason when the retry budget is exhausted", async (t) => {
  const tmpRoot = createPublicHttpRoot(t);
  const artifactDir = path.join(tmpRoot, "artifacts");
  const { baseUrl } = await startServer(t, (_req, res) => {
    const url = new URL(_req.url, "http://127.0.0.1");

    if (url.pathname === "/install.sh") {
      res.writeHead(200, { "Content-Type": "application/x-sh" });
      res.end("#!/bin/sh\necho permanently-stale\n");
      return;
    }
    if (url.pathname === "/install.ps1") {
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      res.end(installPs1);
      return;
    }
    if (url.pathname === "/docs/getting-started/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(gettingStartedHtml());
      return;
    }
    if (url.pathname === "/docs/tooling/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(toolingHtml());
      return;
    }
    if (url.pathname === `/packages/${packageName}`) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<html><body>${packageName} ${packageDescription}</body></html>`);
      return;
    }
    if (url.pathname === "/search" && url.search === `?q=${scopedQuery}`) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<html><body><h1>Results for <span>"${packageName}"</span></h1><p>${packageName}</p><p>${packageDescription}</p></body></html>`
      );
      return;
    }
    if (url.pathname === "/api/v1/packages" && url.search === `?search=${scopedQuery}`) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{ name: packageName, description: packageDescription }]));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`unhandled route: ${url.pathname}${url.search}`);
  });

  const result = await runHelperAsync([
    "public-http",
    "--root",
    tmpRoot,
    "--artifact-dir",
    artifactDir,
    "--site-base-url",
    baseUrl,
    "--packages-site-base-url",
    baseUrl,
    "--registry-base-url",
    baseUrl,
    "--retry-attempts",
    "2",
    "--retry-sleep-seconds",
    "0",
    "--fetch-timeout-seconds",
    "5",
  ]);

  assert.notEqual(result.status, 0, "public-http should fail when the last stale mismatch never clears");
  assert.match(result.stderr, /exhausted 2 attempts/);
  assert.match(result.stderr, /public-install-sh/);

  const publicLog = fs.readFileSync(path.join(artifactDir, "public-http.log"), "utf8");
  assert.match(publicLog, /final\tfailed\tpublic-install-sh: body drifted from website\/docs\/public\/install\.sh/);
});
