# AGENTS.md

## Project Overview

`openwisp-wifi-login-pages` is the React/Node.js frontend for OpenWISP RADIUS captive portal login, signup, verification, and account flows.

Core code lives in this repository root:

- `client/` contains React UI, client utilities, styles, and tests.
- `server/` contains the Node.js server, routes, controllers, and utilities.
- `browser-test/` contains end-to-end browser tests.
- `organizations/`, `config/`, `i18n/`, `public/`, and `scripts/` provide tenant configuration, translations, assets, and tooling.

## Source of Truth

- Use `README.rst` and `docs/` for setup, configuration, and usage.
- Use `package.json`, `yarn.lock`, and `.github/workflows/ci.yml` for CI-tested dependencies, lint, test, browser test, build, and supported Node versions.
- Use GitHub issue/PR templates when asked to open issues or PRs.

If instructions conflict, repository config and CI workflows win first, docs next, and this file is supplemental.

## Development Notes

- Keep changes focused. Avoid unrelated refactors and formatting churn.
- Preserve public configuration, organization override behavior, routing, i18n keys, API contracts with OpenWISP RADIUS, and build outputs unless explicitly required.
- Be careful with authentication flows, signup, password reset, phone/SMS verification, social login, SAML, plan selection, and organization-specific assets.
- Avoid unnecessary blank lines inside functions and methods.
- Update docs and translations when behavior, settings, public APIs, setup steps, or user-facing strings change.

## Testing and QA

- Add or update tests for every behavior change.
- For bug fixes, write the regression test first, run it against the unfixed code, confirm it fails for the expected reason, then implement the fix.
- Use targeted Jest tests while iterating and browser tests for user-facing flow changes.
- Run formatting/linting and `./run-qa-checks` as defined by CI before considering the change complete. Treat failures as blocking unless confirmed unrelated and reported.

## Security Notes

- Watch for auth bypasses, unsafe redirects, token/session leaks, DOM injection, unsafe URL handling, cross-organization data leaks, and exposed secrets.
- Preserve validation and safe handling around login/signup payloads, phone verification, social/SAML responses, plan data, organization config, and external URLs.
- Write comments only when they explain why code is shaped a certain way. Put comments before the relevant block instead of scattering them inside it.

## Troubleshooting

- If setup, QA, tests, browser tests, or builds fail, check docs first, then compare with CI. If commands diverge, follow CI.
