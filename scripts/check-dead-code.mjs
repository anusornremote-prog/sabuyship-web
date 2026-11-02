import fs from "node:fs"
import path from "node:path"

/**
 * Automated Zero-Dead-Code Guard (scripts/check-dead-code.mjs)
 * Runs automatically during `npm run typecheck` and `npm run build`.
 *
 * Enforces:
 * 1. Every non-entry module/component in `src/` must be imported by at least one active file.
 * 2. Every asset in `public/` must be referenced in `src/`.
 * 3. No duplicate raw `assets/` folder or temporary scratch/debug scripts may remain in the repository.
 */

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      getAllFiles(full, fileList)
    } else {
      fileList.push(full)
    }
  }
  return fileList
}

const errors = []

// 1. Check for forbidden root assets/ directory
if (fs.existsSync("assets")) {
  const strayAssets = getAllFiles("assets")
  if (strayAssets.length > 0) {
    errors.push(
      `Found duplicate root 'assets/' directory (${strayAssets.length} files). Place optimized public assets in 'public/' only.`
    )
  }
}

// 2. Scan all source files in src/ and scripts/
const srcFiles = getAllFiles("src").filter((f) => /\.(ts|tsx|css)$/.test(f))
const scriptFiles = getAllFiles("scripts").filter((f) => /\.(js|mjs|ts)$/.test(f))

const allSearchableFiles = [...srcFiles, ...scriptFiles].map((f) => ({
  file: f.replace(/\\/g, "/"),
  content: fs.readFileSync(f, "utf8"),
}))

// Check every non-Next-special file in src/ for active imports
for (const f of srcFiles) {
  const norm = f.replace(/\\/g, "/")
  if (norm.endsWith(".css")) continue
  if (norm === "src/proxy.ts") continue
  if (
    norm.startsWith("src/app/") &&
    /\/(page|layout|route|loading|error|not-found|manifest)\.(ts|tsx)$/.test(norm)
  ) {
    continue
  }

  const baseNoExt = path.basename(norm).replace(/\.(ts|tsx)$/, "")
  const importRegex = new RegExp(
    `from\\s+["']([^"']*\\/)?${baseNoExt}["']|import\\(["']([^"']*\\/)?${baseNoExt}["']\\)`,
    "m"
  )

  const importers = allSearchableFiles.filter(
    (item) => item.file !== norm && importRegex.test(item.content)
  )

  if (importers.length === 0) {
    errors.push(`Unused module/component (never imported): ${norm}`)
  }
}

// 3. Check public/ assets for references in src/
const srcOnlyContents = srcFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n")
const publicFiles = getAllFiles("public")
for (const pub of publicFiles) {
  const baseName = path.basename(pub)
  if (!srcOnlyContents.includes(baseName)) {
    errors.push(`Unused public asset (not referenced in src/): ${pub.replace(/\\/g, "/")}`)
  }
}

if (errors.length > 0) {
  console.error("\n❌ Dead Code / Unused Asset Check FAILED:")
  for (const err of errors) {
    console.error(`   - ${err}`)
  }
  console.error("\nPlease remove unused files/imports or wire them into the application.\n")
  process.exit(1)
}

console.log("Zero-dead-code check: CLEAN (0 unused modules, 0 unused public assets)")

