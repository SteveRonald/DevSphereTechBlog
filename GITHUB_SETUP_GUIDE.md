# GitHub Setup Guide

## Problem: "Publish to branch" message

This happens when:
1. You have a local git repository
2. But no remote repository connected
3. Or the remote repository is empty

## Solution: Set up GitHub properly

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the **"+"** icon → **"New repository"**
3. Name it: `DevSphereTechBlog` (or any name you want)
4. **Don't** initialize with README, .gitignore, or license
5. Click **"Create repository"**

### Step 2: Connect Your Local Repository

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: CodeCraft Academy blog website"

# Add remote repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: If You Already Have a Remote

If you see "publish to branch" but already have a remote:

```bash
# Check current remotes
git remote -v

# If remote exists but is wrong, remove it
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push
git push -u origin main
```

### Step 4: If Branch Name is Different

If your branch is called `master` instead of `main`:

```bash
# Rename branch
git branch -M main

# Push
git push -u origin main
```

## Quick Commands Summary

```bash
# 1. Check status
git status

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: CodeCraft Academy blog"

# 4. Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 5. Push
git push -u origin main
```

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Error: "failed to push some refs"
```bash
# Pull first, then push
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "authentication failed"
- Use GitHub Personal Access Token instead of password
- Or use SSH: `git remote set-url origin git@github.com:USERNAME/REPO.git`

## After Pushing

Once pushed, your code will be on GitHub and you can:
- View it at: `https://github.com/YOUR_USERNAME/REPO_NAME`
- Share it with others
- Deploy to Vercel/Netlify
- Set up CI/CD

