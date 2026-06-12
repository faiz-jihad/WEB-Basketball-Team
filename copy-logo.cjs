const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\03062d2e-372f-4784-9c0a-9c9508d004d5\\media__1781281587816.png";
const dest = path.join(__dirname, 'public', 'logo.png');

try {
  fs.copyFileSync(src, dest);
  console.log("SUCCESS: Logo copied successfully to", dest);
} catch (err) {
  console.error("ERROR: Failed to copy logo:", err);
}
