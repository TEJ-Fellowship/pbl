# GitHub Configuration

## Automated PR Reviews

This directory contains configuration for automated pull request reviews.

### Workflow: `pr-review.yml`

Runs on every pull request to `main`, `master`, `source`, or `samay` branches:

1. **Change detection** – Identifies which projects (directories with `package.json`) have changed files
2. **Lint** – Runs `npm run lint` in each affected project
3. **Build** – Runs `npm run build` in each affected project (does not block merge if it fails)
4. **Format check** – Runs Prettier to verify code formatting

### Enabling Required Status Checks

To require these checks to pass before merging:

1. Go to **Repository Settings** → **Branches** → **Branch protection rules**
2. Add or edit a rule for `main` (or your default branch)
3. Enable **Require status checks to pass before merging**
4. Select **PR Review** (or the specific jobs: `lint-and-build`, `format-check`)
5. Save changes

### PR Template

New pull requests automatically use the template in `PULL_REQUEST_TEMPLATE.md`, which aligns with the [project guidelines](../docs/project-guidelines.md).
