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

- Preserve public configuration, organization override behavior, routing, i18n keys, API contracts with OpenWISP RADIUS, and build outputs unless explicitly required.
- Be careful with authentication flows, signup, password reset, phone/SMS verification, social login, SAML, plan selection, and organization-specific assets.
- Avoid unnecessary blank lines inside functions and methods.
- Update docs and translations when behavior, settings, public APIs, setup steps, or user-facing strings change.

## Testing and QA

- For bug fixes, write the regression test first, run it against the unfixed code, confirm it fails for the expected reason, then implement the fix.
- Use targeted Jest tests while iterating and browser tests for user-facing flow changes.
- Run formatting/linting and `./run-qa-checks` as defined by CI before considering the change complete. Treat failures as blocking unless confirmed unrelated and reported.

## Security Notes

- Watch for auth bypasses, unsafe redirects, token/session leaks, DOM injection, unsafe URL handling, cross-organization data leaks, and exposed secrets.
- Preserve validation and safe handling around login/signup payloads, phone verification, social/SAML responses, plan data, organization config, and external URLs.
- Write comments only when they explain why code is shaped a certain way. Put comments before the relevant block instead of scattering them inside it.

## Troubleshooting

- If setup, QA, tests, browser tests, or builds fail, check docs first, then compare with CI. If commands diverge, follow CI.

## Contributing Guidelines

- Before editing, inspect the relevant implementation, tests, documentation, and configuration. Follow existing repository patterns and do not invent behavior or requirements.
- Keep each contribution focused and change only the lines necessary for its goal. Do not include unrelated refactors, formatting churn, or generated and dependency-file changes unless explicitly required.
- Add or update focused tests for every behavior change. In repositories without a dedicated automated test suite, use the documented build and QA workflow as the equivalent behavior verification. For bug fixes, first reproduce the failure with a regression test when the repository's test setup allows it.
- Run the relevant targeted tests, builds, and documented QA checks, including `./run-qa-checks` when provided. Do not claim a change is complete when verification fails; report the failure or blocker.
- When requirements, intended behavior, or an unexpected failure are unclear, stop and seek clarification instead of making speculative changes.
- When starting work on a new issue, create a new branch from `master`. Use `issues/<issue-number>-<short-title>` for issue work; otherwise, use a short, descriptive branch name.
- Commit messages must be descriptive and use past tense. Past tense is a writing guideline that agents and contributors must follow; it is not checked automatically. For issue work, use an allowed prefix and a capitalized, past-tense subject ending with `#<issue-number>`, for example `[fix] Fixed perennial "modified" state #213`. Repeat the issue reference in the body with `Fixes`, `Closes`, `Resolves`, or `Related to` as appropriate. Use `openwisp-commit --check` to validate the structural commit convention and `cz -n cz_openwisp info` to view the allowed prefixes and message structure. If the repository's declared QA dependency predates these commands, install the development version with `pip install --upgrade "openwisp-utils[qa] @ https://github.com/openwisp/openwisp-utils/archive/refs/heads/master.tar.gz"` in the development environment.
- Add an explanatory commit body only for substantial changes, new features, or non-obvious bug fixes. The releaser automatically publishes the subject of `[feature]`, `[change]`, `[change!]`, `[deps]`, and `[fix]` commits, including scoped variants, in the changelog. Write those subjects in clear, user-friendly language suitable for release notes.
- Send new commits in response to review feedback instead of amending existing commits.
