#!/usr/bin/env node
/**
 * ts-analyzer — Static analysis tool for TypeScript projects.
 *
 * Produces an HTML report with lines of code, function counts,
 * dependency graphs, cyclomatic complexity, and duplicate detection.
 *
 * Usage: node src/index.js <project_dir> [options]
 *
 * Architecture:
 *   index.js          – CLI entry point & orchestration
 *   scanner.js        – Filesystem traversal with ignore patterns
 *   analyzers/*.js    – Pure analysis functions (single-read per file)
 *   report.js         – HTML report generation (template-based)
 */

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./cli');
const { scanTypeScriptFiles } = require('./scanner');
const { analyzeFile } = require('./analyzers/file-analyzer');
const { findDuplicates } = require('./analyzers/duplicates');
const { generateReport } = require('./report');
const { createLogger } = require('./logger');

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const log = createLogger(config.verbose);

  // ── Validate project directory ──────────────────────────────
  if (!fs.existsSync(config.projectDir)) {
    log.error(`Directory not found: ${config.projectDir}`);
    process.exit(1);
  }

  // ── Scan files ──────────────────────────────────────────────
  log.info(`Scanning ${config.projectDir} ...`);
  const files = scanTypeScriptFiles(config.projectDir, {
    ignore: config.ignorePatterns,
  });

  if (files.length === 0) {
    log.warn('No .ts or .tsx files found.');
    process.exit(0);
  }

  log.info(`Found ${files.length} TypeScript file(s).`);

  // ── Analyze each file (single read per file) ───────────────
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    try {
      const result = analyzeFile(filePath, {
        complexity: config.complexity,
        functions: config.functions,
      });
      results.push(result);
    } catch (err) {
      log.warn(`Skipped ${filePath}: ${err.message}`);
    }
    log.progress('Analyzing', i + 1, files.length);
  }

  // ── Duplicate detection (by content hash, not just name) ───
  let duplicateGroups = [];
  if (config.duplicates) {
    log.info('Detecting duplicates by content hash...');
    duplicateGroups = findDuplicates(results);
    log.info(`Found ${duplicateGroups.length} duplicate group(s).`);
  }

  // ── Aggregate metrics ──────────────────────────────────────
  const summary = buildSummary(results, config);

  // ── Generate report ────────────────────────────────────────
  const reportPath = path.resolve(config.projectDir, config.outputPath);
  const html = generateReport({
    projectName: path.basename(path.resolve(config.projectDir)),
    summary,
    results,
    duplicateGroups,
    columns: config,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, html, 'utf-8');
  log.success(`\nReport generated: ${reportPath}`);
}

function buildSummary(results, config) {
  const totalLines = results.reduce((sum, r) => sum + r.lines, 0);
  const totalFiles = results.length;
  const totalFunctions = config.functions
    ? results.reduce((sum, r) => sum + r.functionCount, 0)
    : null;
  const totalComplexity = config.complexity
    ? results.reduce((sum, r) => sum + r.complexity, 0)
    : null;

  let complexityLevel = null;
  if (totalComplexity !== null) {
    if (totalComplexity <= 500) complexityLevel = 'Low';
    else if (totalComplexity <= 1500) complexityLevel = 'Medium';
    else if (totalComplexity <= 3000) complexityLevel = 'High';
    else complexityLevel = 'Very High';
  }

  return { totalFiles, totalLines, totalFunctions, totalComplexity, complexityLevel };
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
