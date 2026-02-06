# ts-audit

Static analysis tool for TypeScript projects. Scans `.ts` and `.tsx` files and generates an interactive HTML report with metrics on lines of code, function counts, dependency mapping, cyclomatic complexity, and duplicate detection.

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

---

## Features

- **Single-read analysis** — each file is read exactly once; all metrics are extracted in a single pass.
- **Content-based duplicate detection** — uses SHA-256 hashes instead of filename comparison.
- **In-process complexity calculation** — no external tools or `execSync` forks per file.
- **Comprehensive function detection** — named functions, arrow functions, class declarations, exported components.
- **Smart ignore patterns** — skips `node_modules`, `dist`, `build`, `.d.ts`, and test files by default.
- **Interactive HTML report** — sortable columns, live search filter, color-coded complexity, responsive design.
- **Zero heavy dependencies** — only `minimist` and `minimatch`.

---

## Quick Start

```bash
# Install dependencies
npm install

# Analyze a project with all features enabled
node src/index.js /path/to/your/project --all

# The report is generated at /path/to/your/project/analysis_report.html
```

---

## Usage

```
node src/index.js <project_dir> [options]
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--all` | `-a` | Enable all analysis features |
| `--duplicates` | `-d` | Detect duplicate files by content hash |
| `--complexity` | `-c` | Calculate cyclomatic complexity |
| `--functions` | `-f` | Count functions, classes, and arrow functions |
| `--path <file>` | `-p` | Output report path (default: `analysis_report.html`) |
| `--ignore <globs>` | `-i` | Additional ignore patterns, comma-separated |
| `--verbose` | `-v` | Verbose console output |
| `--help` | `-h` | Show help message |

> If no analysis flags are provided, all features are enabled by default.

### Examples

```bash
# Full analysis with custom output path
node src/index.js ./my-app --all --path reports/full.html

# Only duplicates and complexity
node src/index.js ./my-app -d -c

# Exclude additional directories
node src/index.js ./my-app --all --ignore "**/generated/**,**/vendor/**"

# Verbose mode for debugging
node src/index.js ./my-app --all --verbose
```

---

## Report Overview

The generated HTML report is fully self-contained (no external dependencies) and includes:

### Summary Cards
Total files, lines of code, function count, aggregate complexity score, and duplicate group count.

### Duplicate Groups
Collapsible sections showing files with identical content, identified by SHA-256 hash.

### File Table
| Column | Description |
|--------|-------------|
| File | Filename (hover for full path) |
| Lines | Total line count |
| Functions | Named functions, arrow functions, and classes |
| Dependencies | Import specifiers (excluding React internals) |
| Complexity | Cyclomatic complexity with color coding |

**Complexity color scale:**

| Score | Level | Color |
|-------|-------|-------|
| 1–5 | Low | 🟢 Green |
| 6–15 | Medium | 🟡 Yellow |
| 16–30 | High | 🟠 Orange |
| 31+ | Critical | 🔴 Red |

The table supports click-to-sort on any column and a live text filter.

---

## Project Structure

```
ts-audit/
├── src/
│   ├── index.js              # Entry point & orchestration
│   ├── cli.js                # Argument parsing & validation
│   ├── scanner.js            # Filesystem traversal with ignore patterns
│   ├── logger.js             # Console output with progress bar
│   ├── report.js             # HTML report generation (template-based)
│   └── analyzers/
│       ├── file-analyzer.js  # Core metrics (single-read per file)
│       └── duplicates.js     # Content-hash duplicate detection
├── tests/
│   └── run.js                # Unit & integration tests
└── package.json
```

---

## Default Ignore Patterns

The scanner skips the following by default:

```
**/node_modules/**
**/dist/**
**/build/**
**/.next/**
**/coverage/**
**/*.d.ts
**/*.spec.ts  /  **/*.spec.tsx
**/*.test.ts  /  **/*.test.tsx
```

Override or extend with `--ignore`:

```bash
node src/index.js ./app --all --ignore "**/migrations/**,**/seeds/**"
```

---

## Cyclomatic Complexity

Complexity is calculated in-process by counting decision points in the source code (after stripping comments and string literals):

| Token | Example |
|-------|---------|
| `if` | `if (condition)` |
| `else if` | `else if (condition)` |
| `for` / `for...of` / `for...in` | `for (const x of items)` |
| `while` / `do...while` | `while (running)` |
| `case` | `case 'value':` |
| `catch` | `catch (error)` |
| `??` | `value ?? fallback` |
| `?.` | `obj?.property` |
| `&&` / <code>&#124;&#124;</code> | `a && b` |
| `? :` | `condition ? a : b` |

Baseline complexity per file is **1**. Each decision point adds **1**.

---

## Tests

```bash
node tests/run.js
```

```
extractFunctions
  ✔ Detects named function declarations
  ✔ Detects arrow functions assigned to const
  ✔ Detects class declarations
  ✔ Detects exported function declarations
  ✔ Does not count non-function assignments

calculateComplexity
  ✔ Baseline complexity is 1
  ✔ Two if-statements = complexity 3
  ✔ for-of + if increases complexity

extractDependencies
  ✔ Excludes react from dependencies
  ✔ Includes third-party dependencies
  ✔ Includes relative imports

findDuplicates
  ✔ Finds one duplicate group
  ✔ Group contains both files
  ✔ Includes first duplicate

analyzeFile (integration)
  ✔ Counts lines
  ✔ Finds >= 3 functions (got 3)
  ✔ Complexity > 1 (got 3)
  ✔ Extracts relative dependency
  ✔ Excludes react
  ✔ Generates SHA-256 hash

────────────────────────────────────────
Results: 20 passed, 0 failed
```

---

## License

GPL-3.0
