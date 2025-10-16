# Self-Review and Auto-Update Planner

## Purpose
Use this with `/system` in Cursor to have the agent review its own work, identify issues, and propose minimal fixes.

## How to Use

1. **Open new chat in Cursor**
2. **Type `/system` and paste this block:**

```markdown
You are a self-review agent. Your task is to review system prompts, handoff documents, and workflow files for accuracy, completeness, and drift from actual implementation.

Your process:
1. Read all referenced files mentioned in the handoff kit
2. Compare documented state vs actual codebase state
3. Identify gaps, outdated info, or missing sections
4. Propose minimal, copy-ready patches

Output format:
- Section-by-section review
- Clear "Found X issues" summary
- Copy-ready search_replace patches
- No narrative, just actionable fixes

Files to review:
- .cursor/commands/system.md (handoff kit)
- Referenced docs (SENTRY_INTEGRATION.md, VERCEL_SETUP.md, etc)
- Package.json files (both repos)
- Recent commits (check what was added)

Focus on:
- Outdated URLs or paths
- Missing recent features
- Incorrect script names
- Dead links
- Version drift
```

3. **Then send:** "Review our prompts and propose minimal fixes. Output copy-ready patches."

## Expected Output

The agent should provide:

### Review Summary
```
Reviewed: system.md
Found: 4 issues
- Section 4: Script name outdated (smokes.mjs → smokes-combined.mjs)
- Section 6: Missing Sentry integration details
- TL;DR: Missing Vercel reference
- Section 3: PR numbers need verification
```

### Copy-Ready Patches
```typescript
// Patch 1: Update Section 4
search_replace({
  file_path: ".cursor/commands/system.md",
  old_string: "...",
  new_string: "..."
})

// Patch 2: Add Sentry to Section 6
...
```

## When to Run This

- **After major features ship** (like Sentry integration)
- **Before creating PRs** (ensure docs match reality)
- **Weekly** (catch drift early)
- **After deployment** (verify URLs and env vars)
- **When handoff to new team member** (ensure accuracy)

## What It Checks

### Accuracy
- ✅ File paths exist and are correct
- ✅ Script names match actual files
- ✅ URLs are valid and current
- ✅ Package versions match package.json
- ✅ Environment variables are documented

### Completeness
- ✅ Recent features are documented
- ✅ All repos are covered
- ✅ Setup steps are complete
- ✅ Acceptance criteria included
- ✅ Troubleshooting sections present

### Drift Detection
- ✅ Docs match codebase state
- ✅ No orphaned references
- ✅ PR numbers are valid
- ✅ Deployment URLs are current
- ✅ Dependencies are listed

## Example Session

```
User: /system [paste prompt above]
Agent: Ready to review.

User: Review our prompts and propose minimal fixes. Output copy-ready patches.

Agent:
### Review Summary
Reviewed .cursor/commands/system.md
Found 3 issues:

1. Section 4: smokes.mjs → smokes-combined.mjs
2. Section 6: Missing Sentry details (just committed)
3. Section 7: Need to add Vercel deployment

### Patches

[Copy-ready search_replace blocks...]

All patches validated against actual files.
```

## Integration with Workflow

This self-review agent complements:
- **Ship Fast** - Quick edits after review
- **Review Spec** - Deep reasoning on architecture
- **General Builder** - Safe implementation after review validates plan

Use **before** major handoffs or deployments to ensure documentation accuracy.

---

**Status:** ✅ Ready to use  
**Last Updated:** October 16, 2025

