import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const declaredFiles = new Set();

function collectPaths(value) {
  if (typeof value === "string") {
    if (value.startsWith("./")) declaredFiles.add(value.slice(2));
    return;
  }

  if (!value || typeof value !== "object") return;
  Object.values(value).forEach(collectPaths);
}

collectPaths(packageJson.main);
collectPaths(packageJson.module);
collectPaths(packageJson.types);
collectPaths(packageJson.exports);

const missingBuildFiles = [...declaredFiles].filter(
  (file) => !existsSync(resolve(file))
);
if (missingBuildFiles.length) {
  throw new Error(
    `Missing declared package files:\n${missingBuildFiles.join("\n")}`
  );
}

const npmArguments = ["pack", "--dry-run", "--json"];
const temporaryDirectory = mkdtempSync(join(tmpdir(), "apf-package-check-"));
let packOutput;
try {
  const options = {
    encoding: "utf8",
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: join(temporaryDirectory, "npm-cache"),
    },
  };
  packOutput = process.env.npm_execpath
    ? execFileSync(
        process.execPath,
        [process.env.npm_execpath, ...npmArguments],
        options
      )
    : execFileSync("npm", npmArguments, options);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
const packFiles = new Set(
  JSON.parse(packOutput)[0].files.map(({ path }) => path.replaceAll("\\", "/"))
);
const missingPackedFiles = [...declaredFiles].filter(
  (file) => !packFiles.has(file.replaceAll("\\", "/"))
);
if (missingPackedFiles.length) {
  throw new Error(
    `Declared package files excluded from npm package:\n${missingPackedFiles.join("\n")}`
  );
}

console.log(`Validated ${declaredFiles.size} declared package files.`);
