/**
 * Filesystem scanner — walks the project tree and returns .ts/.tsx files
 * while respecting ignore patterns (node_modules, dist, .d.ts, etc.)
 */
const fs = require('fs');
const path = require('path');
const { minimatch } = require('minimatch');

/**
 * Scan a directory recursively for TypeScript files.
 *
 * @param {string} rootDir - Root directory to scan
 * @param {object} opts
 * @param {string[]} opts.ignore - Glob patterns to exclude
 * @returns {string[]} Absolute paths to .ts/.tsx files
 */
function scanTypeScriptFiles(rootDir, { ignore = [] } = {}) {
  const absoluteRoot = path.resolve(rootDir);
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // permission denied, symlink loops, etc.
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(absoluteRoot, fullPath);

      // Check ignore patterns against relative path
      const shouldIgnore = ignore.some(pattern =>
        minimatch(relativePath, pattern, { dot: true })
      );
      if (shouldIgnore) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(absoluteRoot);
  return results.sort();
}

module.exports = { scanTypeScriptFiles };
