# Release Process

## Overview

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

## Creating a Changeset

When you make changes to a package, create a changeset:

```powershell
pnpm changeset
```

This will prompt you to:
1. Select which packages changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

## Version Bumping

To consume changesets and bump versions:

```powershell
pnpm version-packages
```

This will:
- Update package versions based on changesets
- Update CHANGELOG.md files
- Remove consumed changesets

## Release Flow

### Automated (GitHub Actions)

When you push to `main`:
1. The `release` workflow runs
2. If changesets exist, it creates a "Version Packages" PR
3. When you merge that PR, packages are published automatically

### Manual

```powershell
# 1. Create changesets for your changes
pnpm changeset

# 2. Bump versions
pnpm version-packages

# 3. Commit version changes
git add .
git commit -m "chore: version packages"

# 4. Build and publish
pnpm release
```

## Canary Releases

For testing before official release:

```powershell
# Create a canary release
pnpm changeset version --snapshot canary
pnpm build
pnpm changeset publish --tag canary
```

## Branch Protection

Recommended GitHub branch protection rules for `main`:

- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks:
  - `verify` (CI)
  - `ipc-contract` (IPC tests)
- ✅ Require branches to be up to date
- ✅ Dismiss stale reviews on new commits
- ⚠️ Do NOT require signed commits (unless you have GPG set up)

## Desktop App Releases

### Deepcode Editor

```powershell
cd projects/active/desktop-apps/deepcode-editor
pnpm build
pnpm package
```

Artifacts in: `release-builds/`

### NOVA Agent

```powershell
cd projects/active/desktop-apps/nova-agent-current
pnpm build
```

Tauri builds automatically create installers.

## Versioning Strategy

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Monorepo Packages

All `@vibetech/*` packages use independent versioning.

## Rollback

If a release has issues:

```powershell
# Revert the version commit
git revert HEAD

# Or manually downgrade versions in package.json
# Then republish
pnpm release
```

## Checklist

Before releasing:

- [ ] All tests passing
- [ ] Changesets created for all changes
- [ ] CHANGELOG entries look correct
- [ ] Desktop apps build successfully
- [ ] Documentation updated
- [ ] Breaking changes communicated

## Support

For questions about the release process, see:
- [Changesets Documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- [Monorepo Quick Start](../MONOREPO_QUICKSTART.md)
