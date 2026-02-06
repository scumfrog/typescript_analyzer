/**
 * Simple logger with progress bar support and color output.
 */

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function createLogger(verbose = false) {
  return {
    info(msg) {
      console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`);
    },

    warn(msg) {
      console.warn(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`);
    },

    error(msg) {
      console.error(`${COLORS.red}✖${COLORS.reset} ${msg}`);
    },

    success(msg) {
      console.log(`${COLORS.green}✔${COLORS.reset} ${msg}`);
    },

    debug(msg) {
      if (verbose) {
        console.log(`${COLORS.dim}  ${msg}${COLORS.reset}`);
      }
    },

    progress(label, current, total) {
      const pct = Math.floor((current / total) * 100);
      const barWidth = 30;
      const filled = Math.floor((current / total) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
      process.stdout.write(`\r  ${label}: ${bar} ${pct}% (${current}/${total})`);
      if (current === total) process.stdout.write('\n');
    },
  };
}

module.exports = { createLogger };
