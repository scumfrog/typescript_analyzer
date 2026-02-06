/**
 * CLI argument parsing with validation and help text.
 */
const minimist = require('minimist');

const HELP_TEXT = `
ts-analyzer — Static analysis for TypeScript projects

Usage:
  node src/index.js <project_dir> [options]

Options:
  -p, --path <file>     Output HTML report path (default: analysis_report.html)
  -d, --duplicates      Detect duplicate files by content hash
  -c, --complexity      Calculate cyclomatic complexity
  -f, --functions       Count functions, classes, arrow functions
  -a, --all             Enable all analysis features
  -i, --ignore <glob>   Additional ignore patterns (comma-separated)
  -v, --verbose         Verbose output
  -h, --help            Show this help

Examples:
  node src/index.js ./my-app --all
  node src/index.js ./my-app -d -c --path report.html
  node src/index.js ./my-app --all --ignore "**/__mocks__/**,**/fixtures/**"
`;

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/*.d.ts',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.test.ts',
  '**/*.test.tsx',
];

function parseArgs(argv) {
  const args = minimist(argv, {
    boolean: ['duplicates', 'complexity', 'functions', 'all', 'help', 'verbose'],
    string: ['path', 'ignore'],
    alias: {
      d: 'duplicates',
      c: 'complexity',
      f: 'functions',
      a: 'all',
      p: 'path',
      h: 'help',
      v: 'verbose',
      i: 'ignore',
    },
    default: {
      path: 'analysis_report.html',
      verbose: false,
    },
  });

  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (args.all) {
    args.duplicates = true;
    args.complexity = true;
    args.functions = true;
  }

  // At least one analysis flag must be set
  if (!args.duplicates && !args.complexity && !args.functions) {
    args.duplicates = true;
    args.complexity = true;
    args.functions = true;
  }

  const projectDir = args._[0];
  if (!projectDir) {
    console.error('Error: project directory is required.\n');
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const extraIgnore = args.ignore
    ? args.ignore.split(',').map(s => s.trim())
    : [];

  return {
    projectDir,
    outputPath: args.path,
    duplicates: args.duplicates,
    complexity: args.complexity,
    functions: args.functions,
    verbose: args.verbose,
    ignorePatterns: [...DEFAULT_IGNORE, ...extraIgnore],
  };
}

module.exports = { parseArgs, DEFAULT_IGNORE };
