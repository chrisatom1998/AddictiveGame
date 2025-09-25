# Remote Repository Quick Reference

## 🚀 One-Command Setup

```bash
# For contributors (fork workflow)
./scripts/setup-remotes.sh

# Sync with upstream
./scripts/sync-upstream.sh

# Push to all remotes
./scripts/push-all.sh
```

## 📋 Common Commands

| Task | Command |
|------|---------|
| Check remotes | `git remote -v` |
| Add upstream | `git remote add upstream https://github.com/chrisatom1998/AddictiveGame.git` |
| Fetch upstream | `git fetch upstream` |
| Sync with upstream | `./scripts/sync-upstream.sh` |
| Push to all remotes | `./scripts/push-all.sh` |
| Setup remotes interactively | `./scripts/setup-remotes.sh` |

## 🔄 Typical Workflow

### For Contributors

1. **Fork** the repository on GitHub
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/AddictiveGame.git`
3. **Setup** remotes: `./scripts/setup-remotes.sh`
4. **Sync** before starting work: `./scripts/sync-upstream.sh`
5. **Create** feature branch: `git checkout -b feature/my-feature`
6. **Work** on your changes
7. **Push** to your fork: `git push origin feature/my-feature`
8. **Create** Pull Request on GitHub

### For Maintainers

1. **Clone** main repository: `git clone https://github.com/chrisatom1998/AddictiveGame.git`
2. **Setup** deployment remotes: `./scripts/setup-remotes.sh`
3. **Deploy** to staging: `git push staging main`
4. **Deploy** to production: `git push production main`
5. **Push** to all environments: `./scripts/push-all.sh`

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `remote already exists` | Use `git remote set-url <name> <url>` |
| `Authentication failed` | Setup SSH keys or personal access token |
| `Push rejected` | Run `git pull --rebase` then push again |
| `Merge conflicts` | Resolve conflicts, commit, then continue |

See [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for comprehensive documentation.