#!/bin/bash
# Push to all configured remotes
# Usage: ./scripts/push-all.sh [branch]

set -e

BRANCH=${1:-$(git branch --show-current)}
echo "🚀 Pushing '$BRANCH' to all remotes..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check if branch exists
if ! git show-ref --verify --quiet refs/heads/$BRANCH; then
    echo "❌ Branch '$BRANCH' does not exist"
    exit 1
fi

# Get list of remotes
REMOTES=$(git remote)

if [ -z "$REMOTES" ]; then
    echo "❌ No remotes configured"
    exit 1
fi

echo "📋 Found remotes: $REMOTES"
echo "🎯 Target branch: $BRANCH"

# Confirm before pushing to multiple remotes
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled by user"
    exit 1
fi

SUCCESS_COUNT=0
FAILURE_COUNT=0
FAILED_REMOTES=""

# Push to each remote
for remote in $REMOTES; do
    echo "⬆️  Pushing to $remote..."
    if git push $remote $BRANCH; then
        echo "✅ Successfully pushed to $remote"
        ((SUCCESS_COUNT++))
    else
        echo "❌ Failed to push to $remote"
        ((FAILURE_COUNT++))
        FAILED_REMOTES="$FAILED_REMOTES $remote"
    fi
    echo
done

# Summary
echo "📊 Push Summary:"
echo "  ✅ Successful: $SUCCESS_COUNT"
echo "  ❌ Failed: $FAILURE_COUNT"

if [ $FAILURE_COUNT -gt 0 ]; then
    echo "  🚨 Failed remotes:$FAILED_REMOTES"
    exit 1
else
    echo "🎉 Successfully pushed to all remotes!"
fi