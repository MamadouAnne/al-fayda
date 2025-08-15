const fs = require('fs');
const path = require('path');

const filePath = path.join(
  'node_modules',
  'react-native-reanimated',
  'lib',
  'module',
  'createAnimatedComponent',
  'InlinePropManager.js'
);

const fullPath = path.resolve(filePath);

// Read the file
let content = fs.readFileSync(fullPath, 'utf8');

// Add null check in hasInlineStyles function
content = content.replace(
  /function hasInlineStyles\(style\) \{/g,
  'function hasInlineStyles(style) {\n  if (!style) return false;'
);

// Add null check in styles forEach
content = content.replace(
  /styles\.forEach\(\(style\) => \{/g,
  'styles.forEach((style) => {\n  if (!style) return;'
);

// Write the changes back to the file
fs.writeFileSync(fullPath, content, 'utf8');

console.log('Successfully applied react-native-reanimated patch!');
