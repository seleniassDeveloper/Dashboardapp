const fs = require('fs');

let content = fs.readFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', 'utf8');

// Replace required: true with required: false
content = content.replace(/required: true/g, 'required: false');

fs.writeFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', content);
