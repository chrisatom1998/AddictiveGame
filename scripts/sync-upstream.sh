#!/bin/bash
# Sync with upstream repository
# Usage: ./scripts/sync-upstream.sh [branch]

set -e

BRANCH=${1:-main}
echo "🔄 Syncing with upstream repository on branch: $BRANCH"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check if upstream remote exists
if ! git remote | grep -q "upstream"; then
    echo "❌ Upstream remote not found. Please add it first:"
    echo "git remote add upstream https://github.com/chrisatom1998/AddictiveGame.git"
    exit 1
fi

# Stash any uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "💾 Stashing uncommitted changes..."
    git stash push -m "Auto-stash before upstream sync"
    STASHED=true
else
    STASHED=false
fi

# Fetch upstream changes
echo "⬇️  Fetching upstream changes..."
git fetch upstream

# Switch to target branch
echo "🔀 Switching to $BRANCH branch..."
git checkout $BRANCH

# Merge upstream changes
echo "🔗 Merging upstream/$BRANCH..."
if git merge upstream/$BRANCH --no-edit; then
    echo "✅ Successfully merged upstream changes"
else
    echo "❌ Merge failed. Please resolve conflicts manually."
    exit 1
fi

# Push to origin
echo "⬆️  Pushing to origin..."
if git push origin $BRANCH; then
    echo "✅ Successfully pushed to origin"
else
    echo "⚠️  Failed to push to origin. You may need to resolve conflicts."
fi

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    echo "📦 Restoring stashed changes..."
    git stash pop
fi

echo "🎉 Successfully synced with upstream repository!"
echo "📊 Summary:"
git log --oneline -5 --graph --decorate