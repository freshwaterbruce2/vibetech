# GitHub Repository Rulesets

This directory contains GitHub repository ruleset configurations for branch protection.

## Available Rulesets

### `main-branch-protection.json`

Protects the `main` branch with the following rules:

| Rule | Description |
|------|-------------|
| **Deletion** | Prevents deletion of the main branch |
| **Non-fast-forward** | Blocks force pushes to the main branch |
| **Pull Request** | Requires at least 1 approving review |
| **Status Checks** | Requires CI checks to pass before merge |

**Required Status Checks:**
- `All CI Checks` - Summary job that validates all CI jobs
- `Code Quality Checks (Nx Affected)` - Linting and type checking
- `Build Application (Nx Affected)` - Production build verification

## How to Import Rulesets

### Option 1: GitHub UI (Recommended)

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Rules** → **Rulesets**
3. Click **New ruleset** → **Import a ruleset**
4. Upload the JSON file from this directory
5. Review the rules and click **Create**

### Option 2: GitHub CLI

```bash
# Using gh api command (replace OWNER/REPO with your repository)
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/OWNER/REPO/rulesets \
  --input .github/rulesets/main-branch-protection.json
```

### Option 3: GitHub REST API

```bash
# Replace OWNER/REPO with your repository and <YOUR-TOKEN> with a valid token
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/rulesets \
  -d @.github/rulesets/main-branch-protection.json
```

## Customizing Rulesets

### Adjusting Required Approvals

Edit `main-branch-protection.json` and change `required_approving_review_count`:

```json
{
  "type": "pull_request",
  "parameters": {
    "required_approving_review_count": 2
  }
}
```

### Adding Status Checks

Add new checks to the `required_status_checks` array:

```json
{
  "type": "required_status_checks",
  "parameters": {
    "required_status_checks": [
      { "context": "All CI Checks" },
      { "context": "Your New Check Name" }
    ]
  }
}
```

### Adding Bypass Actors

Allow specific users or teams to bypass rules:

```json
{
  "bypass_actors": [
    {
      "actor_id": 1,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ]
}
```

Actor types:
- `RepositoryRole` - Repository roles (e.g., admin)
- `Team` - GitHub teams
- `Integration` - GitHub Apps
- `OrganizationAdmin` - Organization admins

## Enforcement Levels

| Level | Description |
|-------|-------------|
| `active` | Rules are enforced |
| `disabled` | Rules exist but are not enforced |
| `evaluate` | Rules are evaluated but violations are logged only |

## Viewing Ruleset Status

After importing, verify your ruleset:

1. Go to **Settings** → **Rules** → **Rulesets**
2. Click on the ruleset name to view details
3. Check the **Enforcement status** is `Active`

## Troubleshooting

### Status Check Names

The status check names must match exactly what appears in GitHub Actions. To find the correct names:

1. Go to a recent pull request
2. Scroll to the **Checks** section
3. Copy the exact check name (case-sensitive)

### Ruleset Not Applying

- Ensure the branch pattern matches (e.g., `refs/heads/main`)
- Verify enforcement is set to `active`
- Check for conflicting organization-level rulesets

## References

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets)
- [Available Rules for Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Ruleset Recipes](https://github.com/github/ruleset-recipes)
