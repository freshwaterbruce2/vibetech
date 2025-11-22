module.exports = {
  // Line width before wrapping
  printWidth: 100,

  // Number of spaces per indentation level
  tabWidth: 2,

  // Use spaces instead of tabs
  useTabs: false,

  // Add semicolons at the end of statements
  semi: true,

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Object properties quote only when necessary
  quoteProps: 'as-needed',

  // Use single quotes in JSX
  jsxSingleQuote: false,

  // Print trailing commas wherever possible
  trailingComma: 'es5',

  // Print spaces between brackets in object literals
  bracketSpacing: true,

  // Put the > of multi-line JSX elements at the end of the last line
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter
  arrowParens: 'avoid',

  // Format only files changed since the beginning
  rangeStart: 0,
  rangeEnd: Infinity,

  // Which parser to use
  parser: undefined,

  // Specify the file name used to infer which parser to use
  filepath: undefined,

  // Restrict Prettier to only format files that contain a special comment
  requirePragma: false,

  // Insert a special marker at the top of files
  insertPragma: false,

  // Wrap prose
  proseWrap: 'preserve',

  // Specify the global whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Whether to indent lines with tabs
  vueIndentScriptAndStyle: false,

  // End of line
  endOfLine: 'lf',

  // Control whether Prettier formats quoted code embedded in the file
  embeddedLanguageFormatting: 'auto',

  // Enforce single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,
};
