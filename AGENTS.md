# AGENTS.md

## Project Overview

`openwisp-wifi-login-pages` is the React/Node.js frontend for OpenWISP RADIUS captive portal login, signup, verification, and account flows.

Core code lives in this repository root:

- `client/` contains React UI, client utilities, styles, and tests.
- `server/` contains the Node.js server, routes, controllers, and utilities.
- `browser-test/` contains end-to-end browser tests.
- `organizations/`, `config/`, `i18n/`, `public/`, and `scripts/` provide tenant configuration, translations, assets, and tooling.
- `docs/` is incorporated into the unified, versioned OpenWISP documentation built by `openwisp-docs`, not a standalone site; use `docs/user/` for end users and `docs/developer/` for contributors and developers of extensions, downstream, or derivative apps.
- `dist/`, generated configuration, organization assets, and translations contain build output.

## Source of Truth

- Use `README.rst` and `docs/` for setup, configuration, and usage.
- Use `package.json`, `yarn.lock`, and `.github/workflows/ci.yml` for CI-tested dependencies, lint, test, browser test, build, and supported Node versions.
- Use GitHub issue/PR templates when asked to open issues or PRs.

If instructions conflict, repository config and CI workflows win first, docs next, and this file is supplemental.

## Contributing Guidelines

- Before editing, inspect the relevant implementation, tests, documentation, and configuration. Follow existing repository patterns and do not invent behavior or requirements.
- Keep each contribution focused and change only the lines necessary for its goal. Do not include unrelated refactors, formatting churn, or generated and dependency-file changes unless explicitly required.
- Add or update focused tests for every behavior change. Use test-driven development when the scope is very clear, such as bug fixes or narrowly scoped changes. For new features, tests may be added after implementation, but confirm they fail when key feature code is removed. When a test failure does not clearly state the expected outcome that was not met, add an explicit assertion message.
- Run `openwisp-qa-format` after each change when available.
- Run the relevant targeted tests, builds, and documented QA checks, including `./run-qa-checks` when provided. Do not claim a change is complete when verification fails; report the failure or blocker.
- When requirements, intended behavior, or an unexpected failure are unclear, stop and seek clarification instead of making speculative changes.
- When starting work on a new issue, create a new branch from `master`. Use `issues/<issue-number>-<short-title>` for issue work; otherwise, use a short, descriptive branch name.
- Commit messages must be descriptive and use past tense. Past tense is a writing guideline that agents and contributors must follow; it is not checked automatically. For issue work, use an allowed prefix and a capitalized, past-tense subject ending with `#<issue-number>`, for example `[fix] Fixed perennial "modified" state #213`. Repeat the issue reference in the body with `Fixes`, `Closes`, `Resolves`, or `Related to` as appropriate. After creating a commit, use `openwisp-commit --check` to validate the current `HEAD`; it cannot validate a proposed message. Use `openwisp-commit --check --rev-range <range>` for an existing commit range, and `cz -n cz_openwisp info` to view allowed prefixes and message structure.
- Add an explanatory commit body only for substantial changes, new features, or non-obvious bug fixes. The releaser automatically publishes the subject of `[feature]`, `[change]`, `[change!]`, `[deps]`, and `[fix]` commits, including scoped variants, in the changelog. Write those subjects in clear, user-friendly language suitable for release notes.
- Send new commits in response to review feedback instead of amending existing commits.

## Development Notes

- Preserve public configuration, organization override behavior, routing, i18n keys, API contracts with OpenWISP RADIUS, and build outputs unless explicitly required.
- Edit `client/`, `server/`, `public/`, organization YAML, and translation `.po` files; regenerate `dist/`, configuration, organization assets, and translations with the documented Yarn commands instead of editing their output directly.
- Be careful with authentication flows, signup, password reset, phone/SMS verification, social login, SAML, plan selection, and organization-specific assets.
- Avoid unnecessary blank lines inside functions and methods.
- Prefer short, precise names that rely on their nearest meaningful scope. Do not repeat a feature, domain object, or namespace already named by the containing module, class, or function. For example, prefer `EstimatedLocation.refresh()` over `EstimatedLocation.refreshEstimatedLocation()`. Repeat that context only when the name is used outside that scope or is needed to distinguish genuinely different concepts. When a concise name cannot express a necessary distinction, use a concise docstring to describe it rather than encoding it in an excessively long name.
- Before adding a comment or docstring, ask whether it conveys information a reader cannot reasonably infer from clear code, names, and surrounding scope. Add a concise comment when it explains a non-obvious reason, constraint, compatibility or security requirement, side effect, or unavoidable complexity. In opaque syntax or domain-specific code, especially shell scripts, a comment may also explain what the code does. Do not add comments that merely restate adjacent code one-to-one.
- Update docs and translations when behavior, settings, public APIs, setup steps, or user-facing strings change, including when a documented feature's behavior changes or a new user-facing feature is added.

## Testing and QA

- Use targeted Jest tests while iterating and browser tests for user-facing flow changes.

## Security Notes

- Watch for auth bypasses, unsafe redirects, token/session leaks, DOM injection, unsafe URL handling, cross-organization data leaks, and exposed secrets.
- Preserve validation and safe handling around login/signup payloads, phone verification, social/SAML responses, plan data, organization config, and external URLs.

## Troubleshooting

- If documentation and CI commands differ, use CI for verification and report the exact documentation path, CI workflow path, and differing commands. Do not change the documentation until the user explicitly chooses one of these actions: update the named documentation file in the current change because the divergence was caused by that change, or leave it unchanged for a separate follow-up. Never decide that scope distinction independently.
