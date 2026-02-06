/**
 * File Analyzer — reads each file exactly ONCE and extracts all metrics.
 *
 * This is the key performance improvement: the original script read each file
 * 3-4 times (once per metric). We read once, parse once, extract everything.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Function detection patterns ──────────────────────────────
// Much more comprehensive than the original `function|class` regex.
const FUNCTION_PATTERNS = [
  // Named function declarations: function foo() {}
  /\bfunction\s+\w+\s*\(/g,
  // Arrow functions assigned to const/let/var: const foo = (...) =>
  /\b(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/g,
  // Class method declarations: methodName(...) { (inside class bodies)
  /^\s+(?:async\s+)?(?:get\s+|set\s+)?(?!if|for|while|switch|catch|return|throw|new|import|export)\w+\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{/gm,
  // Class declarations
  /\bclass\s+\w+/g,
  // React functional components: export default function / export const Foo: React.FC
  /\bexport\s+(?:default\s+)?function\s+\w+/g,
];

// ── Cyclomatic complexity decision points ────────────────────
// Each of these adds 1 to complexity. Baseline is 1 per function.
const COMPLEXITY_TOKENS = [
  /\bif\s*\(/g,
  /\belse\s+if\s*\(/g,
  /\bfor\s*\(/g,
  /\bfor\s+(?:const|let|var)\s+\w+\s+(?:of|in)\b/g,
  /\bwhile\s*\(/g,
  /\bdo\s*\{/g,
  /\bcase\s+/g,
  /\bcatch\s*\(/g,
  /\?\?/g,        // nullish coalescing
  /\?\./g,        // optional chaining (debatable, but adds a path)
  /&&/g,          // logical AND
  /\|\|/g,        // logical OR
  /\?[^?.]/g,     // ternary operator (avoid matching ?. and ??)
];

// ── Import extraction ────────────────────────────────────────
const IMPORT_REGEX = /import\s+(?:(?:type\s+)?(?:{[^}]*}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;

/**
 * Analyze a single TypeScript file. Reads the file exactly once.
 *
 * @param {string} filePath
 * @param {object} opts
 * @param {boolean} opts.complexity - Calculate complexity
 * @param {boolean} opts.functions  - Count functions
 * @returns {FileAnalysis}
 */
function analyzeFile(filePath, { complexity = false, functions = false } = {}) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // Strip comments and strings to avoid false positives
  const stripped = stripCommentsAndStrings(content);

  // Lines of code (non-empty, non-comment lines)
  const lines = content.split('\n');
  const totalLines = lines.length;
  const codeLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('*');
  }).length;

  // Content hash for duplicate detection
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');

  // Function count
  let functionCount = 0;
  let functionNames = [];
  if (functions) {
    const found = extractFunctions(stripped);
    functionCount = found.length;
    functionNames = found;
  }

  // Dependencies
  const dependencies = extractDependencies(content);

  // Cyclomatic complexity (calculated in-process, no external tool needed)
  let complexityScore = 0;
  if (complexity) {
    complexityScore = calculateComplexity(stripped);
  }

  return {
    filePath,
    fileName,
    totalLines,
    codeLines,
    lines: totalLines,
    contentHash,
    functionCount,
    functionNames,
    dependencies,
    complexity: complexityScore,
  };
}

/**
 * Strip single-line comments, multi-line comments, and string literals
 * to avoid false positives in pattern matching.
 */
function stripCommentsAndStrings(code) {
  return code
    // Remove template literals (simplified — handles most cases)
    .replace(/`[^`]*`/gs, '""')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove single-line comments
    .replace(/\/\/.*$/gm, '')
    // Remove string literals
    .replace(/'[^']*'/g, '""')
    .replace(/"[^"]*"/g, '""');
}

/**
 * Extract function/class/method names from stripped source.
 */
function extractFunctions(stripped) {
  const found = new Set();

  // Named functions
  for (const match of stripped.matchAll(/\bfunction\s+(\w+)/g)) {
    found.add(match[1]);
  }

  // Arrow functions assigned to variables
  for (const match of stripped.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/g)) {
    found.add(match[1]);
  }

  // Classes
  for (const match of stripped.matchAll(/\bclass\s+(\w+)/g)) {
    found.add(match[1]);
  }

  return [...found];
}

/**
 * Calculate cyclomatic complexity by counting decision points.
 * This replaces the external `npx cyclomatic-complexity` call.
 */
function calculateComplexity(stripped) {
  let complexity = 1; // baseline

  for (const pattern of COMPLEXITY_TOKENS) {
    const matches = stripped.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

/**
 * Extract import dependencies from source.
 * Returns an array of module specifiers, excluding common framework imports.
 */
function extractDependencies(content) {
  const deps = new Set();
  const EXCLUDED = new Set(['react', 'react-dom', 'react-redux', 'react-router', 'react-router-dom']);

  for (const match of content.matchAll(IMPORT_REGEX)) {
    const specifier = match[1];
    if (!EXCLUDED.has(specifier)) {
      deps.add(specifier);
    }
  }

  return [...deps].sort();
}

module.exports = { analyzeFile, calculateComplexity, extractFunctions, extractDependencies };
