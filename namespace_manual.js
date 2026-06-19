const fs = require('fs');
const path = require('path');

const manualCssPath = path.join(__dirname, 'dashboard-react', 'src', 'landing', 'styles', 'manual.css');
const manualEsPath = path.join(__dirname, 'dashboard-react', 'src', 'views', 'ManualContentEs.jsx');
const manualEnPath = path.join(__dirname, 'dashboard-react', 'src', 'views', 'ManualContentEn.jsx');

let css = fs.readFileSync(manualCssPath, 'utf8');
let es = fs.readFileSync(manualEsPath, 'utf8');
let en = fs.readFileSync(manualEnPath, 'utf8');

// Prefix variables
const vars = ['ink', 'muted', 'line', 'brand', 'brand2', 'brand-soft', 'info', 'info-soft', 'func', 'func-soft', 'chip', 'chip-bg', 'bg', 'card'];
vars.forEach(v => {
  const regex = new RegExp(`--${v}\\b`, 'g');
  css = css.replace(regex, `--manual-${v}`);
});

// Replace body and * selectors
css = css.replace(/\*\{box-sizing:border-box\}/g, '.manual-wrapper * {box-sizing:border-box}');
css = css.replace(/body\s*\{([^}]+)\}/g, '.manual-wrapper {$1}');

// Replace classes
const classes = [
  'wrap', 'cover', 'badge', 'legend', 'legend-grid', 'leg', 'swatch', 
  'sw-desc', 'sw-info', 'sw-func', 'sw-chip', 'module', 'module-body', 
  'screen', 'sub', 'block', 'tag', 'term', 'descr', 'btn', 'pill', 
  'tabs-note', 'layout', 'sidebar', 'main-content', 'gallery'
];

classes.forEach(c => {
  // In CSS
  const cssRegex = new RegExp(`\\.${c}\\b`, 'g');
  css = css.replace(cssRegex, `.manual-${c}`);
  
  // In JSX
  const jsxRegex = new RegExp(`className="${c}"`, 'g');
  es = es.replace(jsxRegex, `className="manual-${c}"`);
  en = en.replace(jsxRegex, `className="manual-${c}"`);
  
  const jsxRegex2 = new RegExp(`className="${c} `, 'g');
  es = es.replace(jsxRegex2, `className="manual-${c} `);
  en = en.replace(jsxRegex2, `className="manual-${c} `);
  
  const jsxRegex3 = new RegExp(` ${c}"`, 'g');
  es = es.replace(jsxRegex3, ` manual-${c}"`);
  en = en.replace(jsxRegex3, ` manual-${c}"`);
  
  const jsxRegex4 = new RegExp(` ${c} `, 'g');
  es = es.replace(jsxRegex4, ` manual-${c} `);
  en = en.replace(jsxRegex4, ` manual-${c} `);
});

// Also wrap the whole JSX in <div className="manual-wrapper">
es = es.replace('<div onClick={handleImageClick}>', '<div className="manual-wrapper" onClick={handleImageClick}>');
en = en.replace('<div onClick={handleImageClick}>', '<div className="manual-wrapper" onClick={handleImageClick}>');

fs.writeFileSync(manualCssPath, css);
fs.writeFileSync(manualEsPath, es);
fs.writeFileSync(manualEnPath, en);

console.log("Done");
