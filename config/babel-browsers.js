/**
 * Shared browser targets for Babel transpilation.
 * Used by both babel.config.js (project source) and webpack.config.js
 * (node_modules) to ensure both are compiled to the same compatibility level.
 */
module.exports = {ie: "11"};
