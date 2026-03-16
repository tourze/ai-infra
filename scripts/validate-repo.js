#!/usr/bin/env node
/**
 * Run the repository quality gate test suite.
 */

const fs = require('node:fs');
const path = require('node:path');

const { Colors, runCommand } = require('./utils');

const TESTS = [
  'test-sync-skills.js',
  'test-package-entrypoints.js',
  'test-link-skills.js',
  'test-sync-agent-memory.js',
  'test-claude-hooks.js',
];

function runTest(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`${Colors.FAIL}Error:${Colors.ENDC} Test script not found: ${scriptPath}`);
    return false;
  }

  console.log(`${Colors.OKCYAN}Running ${scriptName}...${Colors.ENDC}`);
  const result = runCommand(process.execPath, [scriptPath], { timeout: 60000 });

  if (result.status === 0) {
    console.log(`${Colors.OKGREEN}PASS${Colors.ENDC} ${scriptName}`);
    return true;
  }

  console.log(`${Colors.FAIL}FAIL${Colors.ENDC} ${scriptName}`);
  if (result.stdout) {
    console.log(`${Colors.WARNING}stdout:${Colors.ENDC} ${result.stdout.trim()}`);
  }
  if (result.stderr) {
    console.log(`${Colors.WARNING}stderr:${Colors.ENDC} ${result.stderr.trim()}`);
  }
  return false;
}

function main() {
  console.log(`${Colors.BOLD}${Colors.HEADER}Running repository quality gate tests...${Colors.ENDC}`);
  console.log('');

  const results = TESTS.map((testName) => [testName, runTest(testName)]);
  console.log('');
  console.log(`${Colors.BOLD}Test Summary:${Colors.ENDC}`);

  let allPassed = true;
  for (const [testName, passed] of results) {
    const status = passed
      ? `${Colors.OKGREEN}PASS${Colors.ENDC}`
      : `${Colors.FAIL}FAIL${Colors.ENDC}`;
    console.log(`  ${testName}: ${status}`);
    allPassed = allPassed && passed;
  }

  console.log('');
  if (allPassed) {
    console.log(`${Colors.OKGREEN}${Colors.BOLD}repo validation passed${Colors.ENDC}`);
    return 0;
  }

  console.log(`${Colors.FAIL}${Colors.BOLD}repo validation failed${Colors.ENDC}`);
  return 1;
}

process.exit(main());
