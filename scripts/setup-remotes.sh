#!/bin/bash
# Setup remote repositories for AddictiveGame project
# Usage: ./scripts/setup-remotes.sh

set -e

echo "🔧 Setting up remote repositories for AddictiveGame"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Function to add remote safely
add_remote() {
    local name=$1
    local url=$2
    
    if git remote | grep -q "^$name$"; then
        echo "⚠️  Remote '$name' already exists. Current URL:"
        git remote get-url $name
        read -p "Update URL to $url? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url $name $url
            echo "✅ Updated remote '$name'"
        else
            echo "⏭️  Skipping remote '$name'"
        fi
    else
        git remote add $name $url
        echo "✅ Added remote '$name': $url"
    fi
}

# Get current origin URL to determine setup type
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [[ $ORIGIN_URL == *"chrisatom1998/AddictiveGame"* ]]; then
    echo "📍 Detected: Working with main repository"
    
    # This is the main repository, ask about deployment remotes
    echo
    echo "🚀 Optional: Add deployment remotes"
    
    read -p "Add production remote? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Production repository URL: " PROD_URL
        if [ ! -z "$PROD_URL" ]; then
            add_remote "production" "$PROD_URL"
        fi
    fi
    
    read -p "Add staging remote? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Staging repository URL: " STAGING_URL
        if [ ! -z "$STAGING_URL" ]; then
            add_remote "staging" "$STAGING_URL"
        fi
    fi
    
else
    echo "📍 Detected: Working with a fork"
    
    # This is likely a fork, add upstream
    echo "🔗 Adding upstream remote..."
    add_remote "upstream" "https://github.com/chrisatom1998/AddictiveGame.git"
    
    # Fetch upstream
    echo "⬇️  Fetching upstream..."
    git fetch upstream
fi

# Show final remote configuration
echo
echo "📋 Current remote configuration:"
git remote -v

echo
echo "🎉 Remote setup complete!"
echo
echo "💡 Next steps:"
if git remote | grep -q "upstream"; then
    echo "  • Run './scripts/sync-upstream.sh' to sync with upstream"
fi
echo "  • Run './scripts/push-all.sh' to push to all remotes"
echo "  • See GIT_WORKFLOW.md for detailed usage instructions"