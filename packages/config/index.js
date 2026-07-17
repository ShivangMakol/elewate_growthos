// Barrel entry point for @elewate/config.
// Downstream packages import specific configs directly, e.g.:
//   import baseConfig from "@elewate/config/eslint.base.js";
//   const prettierConfig = require("@elewate/config/prettier.base.js");
// tsconfig.base.json is NOT duplicated here — it lives at the repo root
// (see /tsconfig.base.json) since it must be reachable via a relative
// "extends" path from every workspace package without a package resolution hop.
module.exports = {
  eslintBasePath: "./eslint.base.mjs",
  prettierBasePath: "./prettier.base.js",
};
