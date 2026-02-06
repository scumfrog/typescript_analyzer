/**
 * Basic test suite for ts-analyzer.
 * Run: node tests/run.js
 */
const { analyzeFile, calculateComplexity, extractFunctions, extractDependencies } = require('../src/analyzers/file-analyzer');
const { findDuplicates } = require('../src/analyzers/duplicates');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✔ ${message}`);
  } else {
    failed++;
    console.error(`  ✖ ${message}`);
  }
}

// ── Helper: create temp .ts file ─────────────────────────────
function createTempFile(content) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-analyzer-test-'));
  const filePath = path.join(tmpDir, 'test.ts');
  fs.writeFileSync(filePath, content, 'utf-8');
  return { filePath, tmpDir };
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Tests: extractFunctions ──────────────────────────────────
console.log('\n📦 extractFunctions');

assert(
  extractFunctions('function hello() {}').includes('hello'),
  'Detects named function declarations'
);

assert(
  extractFunctions('const greet = (name: string) => {}').includes('greet'),
  'Detects arrow functions assigned to const'
);

assert(
  extractFunctions('class MyService {}').includes('MyService'),
  'Detects class declarations'
);

assert(
  extractFunctions('export default function App() {}').includes('App'),
  'Detects exported function declarations'
);

assert(
  extractFunctions('const x = 5; const y = "hello";').length === 0,
  'Does not count non-function assignments'
);

// ── Tests: calculateComplexity ───────────────────────────────
console.log('\n📦 calculateComplexity');

assert(
  calculateComplexity('const x = 1;') === 1,
  'Baseline complexity is 1'
);

assert(
  calculateComplexity('if (a) {} if (b) {}') === 3,
  'Two if-statements = complexity 3'
);

assert(
  calculateComplexity('for (const x of items) { if (x > 0) {} }') > 2,
  'for-of + if increases complexity'
);

// ── Tests: extractDependencies ───────────────────────────────
console.log('\n📦 extractDependencies');

const deps = extractDependencies(`
  import { useState } from 'react';
  import axios from 'axios';
  import { helper } from './utils';
`);

assert(!deps.includes('react'), 'Excludes react from dependencies');
assert(deps.includes('axios'), 'Includes third-party dependencies');
assert(deps.includes('./utils'), 'Includes relative imports');

// ── Tests: findDuplicates ────────────────────────────────────
console.log('\n📦 findDuplicates');

const fakeResults = [
  { filePath: '/a/foo.ts', contentHash: 'aaa' },
  { filePath: '/b/foo.ts', contentHash: 'aaa' },
  { filePath: '/c/bar.ts', contentHash: 'bbb' },
  { filePath: '/d/baz.ts', contentHash: 'ccc' },
];

const groups = findDuplicates(fakeResults);
assert(groups.length === 1, 'Finds one duplicate group');
assert(groups[0].files.length === 2, 'Group contains both files');
assert(groups[0].files.includes('/a/foo.ts'), 'Includes first duplicate');

// ── Tests: analyzeFile (integration) ─────────────────────────
console.log('\n📦 analyzeFile (integration)');

const testCode = `
import { something } from './module';
import React from 'react';

function processData(items: string[]) {
  for (const item of items) {
    if (item.length > 0) {
      console.log(item);
    }
  }
}

const helper = (x: number) => x * 2;

class DataService {
  fetch() { return []; }
}

export default processData;
`;

const { filePath: testFile, tmpDir } = createTempFile(testCode);
const result = analyzeFile(testFile, { complexity: true, functions: true });

assert(result.totalLines > 0, 'Counts lines');
assert(result.functionCount >= 3, `Finds >= 3 functions (got ${result.functionCount})`);
assert(result.complexity > 1, `Complexity > 1 (got ${result.complexity})`);
assert(result.dependencies.includes('./module'), 'Extracts relative dependency');
assert(!result.dependencies.includes('react'), 'Excludes react');
assert(result.contentHash.length === 64, 'Generates SHA-256 hash');

cleanup(tmpDir);

// ── Summary ──────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
