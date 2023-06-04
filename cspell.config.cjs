/** @type { import("cspell").CSpellSettings } */
const baseConfig = require("@falkor/falkor-cspell-config");
baseConfig.words.push("deduped");
module.exports = baseConfig;
