#!/usr/bin/env node

/**
 * TypeScript Migration Helper
 * Helps identify and fix common TypeScript errors after enabling strict settings
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { log, colors } = require('./utils');

function runTypeCheck() {
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    return { success: true, errors: [] };
  } catch (error) {
    const output = error.stdout?.toString() || '';
    const errors = parseTypeScriptErrors(output);
    return { success: false, errors };
  }
}

function parseTypeScriptErrors(output) {
  const lines = output.split('\n');
  const errors = [];
  const errorRegex = /^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

  for (const line of lines) {
    const match = line.match(errorRegex);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
      });
    }
  }

  return errors;
}

function categorizeErrors(errors) {
  const categories = {
    exactOptionalPropertyTypes: [],
    noPropertyAccessFromIndexSignature: [],
    noImplicitOverride: [],
    noUncheckedIndexedAccess: [],
    noImplicitReturns: [],
    importMetaEnv: [],
    other: [],
  };

  for (const error of errors) {
    if (error.message.includes('exactOptionalPropertyTypes')) {
      categories.exactOptionalPropertyTypes.push(error);
    } else if (error.code === 'TS4111' || error.code === 'TS4110') {
      categories.noPropertyAccessFromIndexSignature.push(error);
    } else if (error.code === 'TS4114') {
      categories.noImplicitOverride.push(error);
    } else if (error.code === 'TS2532' || error.message.includes("possibly 'undefined'")) {
      categories.noUncheckedIndexedAccess.push(error);
    } else if (error.code === 'TS7030') {
      categories.noImplicitReturns.push(error);
    } else if (error.message.includes('ImportMeta')) {
      categories.importMetaEnv.push(error);
    } else {
      categories.other.push(error);
    }
  }

  return categories;
}

function generateFixSuggestions(categories) {
  const suggestions = [];

  if (categories.exactOptionalPropertyTypes.length > 0) {
    suggestions.push({
      title: 'Fix exactOptionalPropertyTypes errors',
      description: 'Add | undefined to optional properties that can be explicitly undefined',
      example: `
// Before:
interface Props {
  value?: string;
}

// After:
interface Props {
  value?: string | undefined;
}`,
      count: categories.exactOptionalPropertyTypes.length,
    });
  }

  if (categories.noPropertyAccessFromIndexSignature.length > 0) {
    suggestions.push({
      title: 'Fix index signature access',
      description: 'Use bracket notation for index signature properties',
      example: `
// Before:
process.env.MY_VAR

// After:
process.env['MY_VAR']`,
      count: categories.noPropertyAccessFromIndexSignature.length,
    });
  }

  if (categories.noImplicitOverride.length > 0) {
    suggestions.push({
      title: 'Add override keywords',
      description: 'Add override keyword to methods that override base class methods',
      example: `
// Before:
componentDidCatch(error, info) { }

// After:
override componentDidCatch(error, info) { }`,
      count: categories.noImplicitOverride.length,
    });
  }

  if (categories.noUncheckedIndexedAccess.length > 0) {
    suggestions.push({
      title: 'Handle possibly undefined values',
      description: 'Add null checks or use optional chaining for array/object access',
      example: `
// Before:
const value = array[index];

// After:
const value = array[index] ?? defaultValue;
// or
const value = array[index]!; // if you're certain`,
      count: categories.noUncheckedIndexedAccess.length,
    });
  }

  if (categories.noImplicitReturns.length > 0) {
    suggestions.push({
      title: 'Fix missing return statements',
      description: 'Ensure all code paths return a value',
      example: `
// Before:
function getValue(condition: boolean): string {
  if (condition) {
    return "value";
  }
}

// After:
function getValue(condition: boolean): string {
  if (condition) {
    return "value";
  }
  return "default";
}`,
      count: categories.noImplicitReturns.length,
    });
  }

  return suggestions;
}

function generateReport(errors, categories, suggestions) {
  const report = [];

  report.push('');
  log('TypeScript Strict Mode Migration Report', 'cyan');
  log('=======================================', 'cyan');
  report.push('');

  log(`Total errors found: ${errors.length}`, 'yellow');
  report.push('');

  log('Error breakdown:', 'blue');
  for (const [category, categoryErrors] of Object.entries(categories)) {
    if (categoryErrors.length > 0) {
      log(`  ${category}: ${categoryErrors.length}`, 'magenta');
    }
  }

  report.push('');
  log('Suggested fixes:', 'green');
  log('================', 'green');

  for (const suggestion of suggestions) {
    report.push('');
    log(`${suggestion.title} (${suggestion.count} errors)`, 'yellow');
    log(suggestion.description, 'reset');
    if (suggestion.example) {
      log('Example:', 'blue');
      console.log(suggestion.example);
    }
  }

  report.push('');
  log('Migration strategy:', 'cyan');
  log('==================', 'cyan');
  log('1. Start with the most common error types', 'reset');
  log('2. Use find-and-replace for systematic fixes', 'reset');
  log('3. Run typecheck frequently to track progress', 'reset');
  log('4. Use @ts-expect-error temporarily for complex cases', 'reset');
  log('5. Consider fixing one file at a time for large codebases', 'reset');

  return report.join('\n');
}

function main() {
  log('Running TypeScript strict mode analysis...', 'cyan');

  const { success, errors } = runTypeCheck();

  if (success) {
    log('✅ No TypeScript errors found!', 'green');
    return;
  }

  const categories = categorizeErrors(errors);
  const suggestions = generateFixSuggestions(categories);
  const report = generateReport(errors, categories, suggestions);

  // Write detailed error list to file
  const errorDetails = errors
    .map((e) => `${e.file}:${e.line}:${e.column} - ${e.code}: ${e.message}`)
    .join('\n');

  fs.writeFileSync(path.join(process.cwd(), 'typescript-errors.txt'), errorDetails);

  log('', 'reset');
  log('Detailed error list written to: typescript-errors.txt', 'blue');

  // Offer to generate specific fix scripts
  log('', 'reset');
  log('Would you like to generate automated fix scripts? (Coming soon)', 'yellow');
}

if (require.main === module) {
  main();
}
