// Root Prettier entry point. Real config lives in packages/config/prettier.base.js
// (TDD 4.2: "config centralized in packages/config"). Imported via the package
// specifier to prove the workspace link + exports map resolve.
module.exports = require("@elewate/config/prettier.base.js");
