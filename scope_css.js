const fs = require('fs');
let css = fs.readFileSync('dashboard-react/src/landing/styles/manual.css', 'utf8');

// Replace body with .manual-view-scoped
css = css.replace(/body\s*\{/g, '.manual-view-scoped {');

// We want to prefix all selectors with .manual-view-scoped
// A simple way is to split by '}'
let parts = css.split('}');
for (let i = 0; i < parts.length; i++) {
  let part = parts[i];
  if (!part.trim()) continue;
  
  // Split into selector and rules
  let [selectorPart, rules] = part.split('{');
  if (!rules) continue;

  selectorPart = selectorPart.trim();
  
  // Skip @media, :root
  if (selectorPart.startsWith('@media')) {
    // We need to handle @media blocks differently
    // For simplicity, let's just do a manual replacement for this specific file, it's very short.
    continue;
  }
}
