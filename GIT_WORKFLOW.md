# Git Workflow and Remote Repository Management

This document provides comprehensive guidance for working with remote repositories in the AddictiveGame project.

## 🔄 Remote Repository Setup

### Current Repository Configuration

The project uses the following remote repository structure:

```bash
# Check current remotes
git remote -v

# Expected output:
# origin  https://github.com/chrisatom1998/AddictiveGame (fetch)
# origin  https://github.com/chrisatom1998/AddictiveGame (push)
```

### Adding Additional Remotes

#### For Contributors (Fork Workflow)

1. **Fork the repository** on GitHub to your account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AddictiveGame.git
   cd AddictiveGame
   ```

3. **Add upstream remote** to track the original repository:
   ```bash
   git remote add upstream https://github.com/chrisatom1998/AddictiveGame.git
   ```

4. **Verify remotes**:
   ```bash
   git remote -v
   # Should show:
   # origin    https://github.com/YOUR_USERNAME/AddictiveGame.git (fetch)
   # origin    https://github.com/YOUR_USERNAME/AddictiveGame.git (push)
   # upstream  https://github.com/chrisatom1998/AddictiveGame.git (fetch)
   # upstream  https://github.com/chrisatom1998/AddictiveGame.git (push)
   ```

#### For Deployment (Production/Staging)

Add deployment remotes for different environments:

```bash
# Add production remote
git remote add production https://github.com/your-org/addictive-game-prod.git

# Add staging remote
git remote add staging https://github.com/your-org/addictive-game-staging.git

# Add development remote
git remote add development https://github.com/your-org/addictive-game-dev.git
```

## 🚀 Working with Multiple Remotes

### Keeping Your Fork Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push updated main to your fork
git push origin main
```

### Branch Management

```bash
# Create feature branch from updated main
git checkout -b feature/your-feature-name

# Work on your changes
# ... make commits ...

# Push feature branch to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub web interface
```

### Syncing Before Pull Requests

```bash
# Before creating PR, sync with upstream
git checkout main
git fetch upstream
git merge upstream/main
git checkout feature/your-feature-name
git rebase main

# Force push rebased branch (only if no one else is working on it)
git push origin feature/your-feature-name --force-with-lease
```

## 🔧 Common Remote Operations

### Managing Remote URLs

```bash
# Change remote URL (e.g., from HTTPS to SSH)
git remote set-url origin git@github.com:chrisatom1998/AddictiveGame.git

# Add SSH remote for faster operations
git remote add origin-ssh git@github.com:chrisatom1998/AddictiveGame.git

# Remove a remote
git remote remove old-remote-name
```

### Pushing to Specific Remotes

```bash
# Push to origin (default)
git push origin main

# Push to upstream (if you have push access)
git push upstream main

# Push to multiple remotes
git push origin main && git push upstream main
```

### Fetching from Multiple Remotes

```bash
# Fetch from all remotes
git fetch --all

# Fetch from specific remote
git fetch upstream

# Fetch and prune deleted branches
git fetch --all --prune
```

## 🔀 Deployment Workflows

### Production Deployment

```bash
# Deploy to production from main branch
git checkout main
git pull origin main
git push production main
```

### Staging Deployment

```bash
# Deploy to staging from develop branch
git checkout develop
git pull origin develop
git push staging develop
```

### Feature Testing

```bash
# Deploy feature branch to development environment
git push development feature/your-feature-name
```

## 🛠️ Automation Scripts

### Sync Script

Create a script to automate upstream syncing:

```bash
#!/bin/bash
# File: scripts/sync-upstream.sh

echo "🔄 Syncing with upstream repository..."

# Check if upstream remote exists
if ! git remote | grep -q "upstream"; then
    echo "❌ Upstream remote not found. Please add it first:"
    echo "git remote add upstream https://github.com/chrisatom1998/AddictiveGame.git"
    exit 1
fi

# Fetch upstream changes
git fetch upstream

# Switch to main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to origin
git push origin main

echo "✅ Successfully synced with upstream!"
```

### Multi-Remote Push Script

```bash
#!/bin/bash
# File: scripts/push-all.sh

BRANCH=${1:-main}
echo "🚀 Pushing $BRANCH to all remotes..."

# Get list of remotes
REMOTES=$(git remote)

for remote in $REMOTES; do
    echo "Pushing to $remote..."
    git push $remote $BRANCH
done

echo "✅ Pushed to all remotes!"
```

## 🔐 Authentication Setup

### SSH Keys (Recommended)

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

2. **Add SSH key to ssh-agent**:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Add public key to GitHub**: Copy `~/.ssh/id_ed25519.pub` to GitHub settings

4. **Test connection**:
   ```bash
   ssh -T git@github.com
   ```

### Personal Access Tokens

For HTTPS authentication:
1. Create a Personal Access Token on GitHub
2. Use it as password when prompted
3. Cache credentials:
   ```bash
   git config --global credential.helper cache
   ```

## 📋 Best Practices

### Remote Naming Conventions

- `origin`: Your fork (for contributors) or main repo (for maintainers)
- `upstream`: Original repository (when working with forks)
- `production`: Production deployment repository
- `staging`: Staging environment repository
- `development`: Development environment repository

### Branch Protection

Protect important branches by configuring branch protection rules on GitHub:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Require conversation resolution

### Regular Maintenance

```bash
# Weekly maintenance routine
git fetch --all --prune
git branch --merged main | grep -v main | xargs -n 1 git branch -d
git gc --prune=now
```

## 🚨 Troubleshooting

### Remote Already Exists

```bash
# Error: remote origin already exists
git remote set-url origin https://new-url.git
```

### Authentication Issues

```bash
# For HTTPS authentication problems
git config --global credential.helper store

# For SSH key issues
ssh-add -l  # List loaded keys
ssh-add ~/.ssh/id_rsa  # Add key if missing
```

### Merge Conflicts

```bash
# When syncing with upstream causes conflicts
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "Resolve merge conflicts"
```

### Push Rejected

```bash
# When push is rejected due to non-fast-forward
git pull --rebase origin main
git push origin main
```

## 🔍 Verification Commands

Use these commands to verify your remote setup:

```bash
# Check all remotes
git remote -v

# Check branch tracking
git branch -vv

# Check what you're about to push
git log origin/main..HEAD --oneline

# Check if branch is ahead/behind
git status -b
```

---

For more information about Git workflows, see the [Git documentation](https://git-scm.com/doc) or GitHub's [Git Handbook](https://guides.github.com/introduction/git-handbook/).