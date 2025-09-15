import { parse, stringify } from '../src';
import { readFileSync, writeFileSync } from 'fs';
import { AnnotationType } from '../src/types';

// Read the YTT config file
const yttContent = readFileSync('examples/config.yml', 'utf-8');
console.log('Original YTT Configuration:');
console.log('===========================');
console.log(yttContent);
console.log();

// Parse the YTT content to AST
const ast = parse(yttContent);

// Define the new supervisor configuration
const newSupervisors = {
  "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c"],
  "us-west-1": ["us-west-1a", "us-west-1b"],
  "eu-central-1": "*",
  "ap-south-1": ["ap-south-1a"]
};

// Find and update the allowed_supervisors multi-line annotation
if (ast.annotations) {
  for (let i = 0; i < ast.annotations.length; i++) {
    const ann = ast.annotations[i];

    // Check if this is the allowed_supervisors block (now a single multi-line annotation)
    if (ann.type === AnnotationType.CODE && ann.value?.includes('allowed_supervisors')) {
      console.log('Found allowed_supervisors annotation at index', i);

      // Format the new supervisors with proper indentation
      const jsonStr = JSON.stringify(newSupervisors, null, 2);
      const lines = jsonStr.split('\n');

      // Build the new multi-line value with proper indentation
      const newLines = [];
      newLines.push(`allowed_supervisors = ${lines[0]}`);

      for (let j = 1; j < lines.length - 1; j++) {
        // Add single space indentation for nested lines (matching YTT style)
        newLines.push(' ' + lines[j].trim());
      }

      newLines.push(lines[lines.length - 1]); // closing brace

      // Update the annotation value as a single multi-line string
      ann.value = newLines.join('\n');
      console.log('Updated annotation value');
      break;
    }
  }
}

// Convert back to YTT string
const updatedYtt = stringify(ast);

console.log('\nUpdated YTT Configuration:');
console.log('===========================');
console.log(updatedYtt);

// Save to a new file
writeFileSync('examples/config-updated.yml', updatedYtt);
console.log('\nUpdated configuration saved to: examples/config-updated.yml');