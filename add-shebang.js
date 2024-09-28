const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "dist", "index.js");
const shebang = "#!/usr/bin/env node\n";

let data = fs.readFileSync(filePath, "utf8");

// If the shebang line doesn't exist, add it
if (!data.startsWith(shebang)) {
  fs.writeFileSync(filePath, shebang + data, "utf8");
  console.log("Shebang line added to dist/index.js");
} else {
  console.log("Shebang line already present in dist/index.js");
}
