/**
 * Duplicate Detection — finds files with identical content using SHA-256 hashes.
 *
 * The original script compared files by NAME only (e.g., two "index.ts" files
 * would be flagged as duplicates even if they had completely different content).
 * This module uses content hashes for accurate detection.
 */

/**
 * Group files by content hash and return groups with 2+ identical files.
 *
 * @param {Array<{filePath: string, contentHash: string}>} results
 * @returns {Array<{hash: string, files: string[]}>}
 */
function findDuplicates(results) {
  const hashMap = new Map();

  for (const result of results) {
    const { contentHash, filePath } = result;
    if (!hashMap.has(contentHash)) {
      hashMap.set(contentHash, []);
    }
    hashMap.get(contentHash).push(filePath);
  }

  // Only keep groups with actual duplicates
  const groups = [];
  for (const [hash, files] of hashMap) {
    if (files.length > 1) {
      groups.push({ hash, files });
    }
  }

  return groups;
}

/**
 * Build a Set of file paths that are part of any duplicate group.
 * Useful for highlighting in the report table.
 */
function getDuplicateFilePaths(groups) {
  const paths = new Set();
  for (const group of groups) {
    for (const file of group.files) {
      paths.add(file);
    }
  }
  return paths;
}

module.exports = { findDuplicates, getDuplicateFilePaths };
