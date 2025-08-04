# 🔄 How to Update Your Local Project

When the main project gets updated with new features, bug fixes, or improvements, you'll need to update your local copy. Here's how to do it safely.

## 🚀 Quick Update (No Local Changes)

If you haven't made any changes to your local files:

```bash
# Navigate to your project directory
cd restaurant-pos-system

# Pull the latest changes from GitHub
git pull origin main

# Install any new dependencies
npm run install-all

# Update database if there are schema changes
npm run setup-db

# Start the updated application
npm run dev
```

## ⚠️ Update with Local Changes

If you've made changes to your local files, you need to handle them carefully:

### Option 1: Backup and Update (Recommended)
```bash
# Navigate to your project directory
cd restaurant-pos-system

# Create a backup of your changes
git stash push -m "My local changes before update"

# Pull the latest changes
git pull origin main

# Install new dependencies
npm run install-all

# Update database
npm run setup-db

# Restore your changes (if you want them back)
git stash pop

# Resolve any conflicts if they occur
# Then restart the application
npm run dev
```

### Option 2: Create a Branch for Your Changes
```bash
# Create a branch for your changes
git checkout -b my-local-changes

# Commit your changes
git add .
git commit -m "My local modifications"

# Switch back to main branch
git checkout main

# Pull the latest changes
git pull origin main

# Install new dependencies
npm run install-all

# Update database
npm run setup-db

# Merge your changes back (if needed)
git merge my-local-changes

# Resolve conflicts if any
# Then restart the application
npm run dev
```

### Option 3: Reset and Start Fresh
If you don't need your local changes:
```bash
# Navigate to your project directory
cd restaurant-pos-system

# Reset to match the remote repository
git fetch origin
git reset --hard origin/main

# Install dependencies
npm run install-all

# Update database
npm run setup-db

# Start the application
npm run dev
```

## 🔧 Common Update Scenarios

### New Features Added
```bash
git pull origin main
npm run install-all
npm run dev
```

### Database Schema Changes
```bash
git pull origin main
npm run install-all
npm run setup-db  # This will update your database schema
npm run dev
```

### New Dependencies Added
```bash
git pull origin main
npm run install-all  # This installs new packages
npm run dev
```

### Configuration Changes
```bash
git pull origin main
# Check if server/config.env needs updates
# Compare with the example in SETUP_GUIDE.md
npm run dev
```

## 🚨 Troubleshooting Updates

### Merge Conflicts
If you get merge conflicts:
1. Open the conflicted files
2. Look for `<<<<<<<`, `=======`, and `>>>>>>>` markers
3. Choose which changes to keep
4. Remove the conflict markers
5. Save the files
6. `git add .`
7. `git commit -m "Resolve merge conflicts"`

### Database Issues After Update
```bash
# Reset database to match new schema
cd server
npx prisma db push --force-reset
cd ..
npm run setup-db
```

### Node Modules Issues
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
cd server && rm -rf node_modules package-lock.json
cd ../client && rm -rf node_modules package-lock.json
cd ..
npm run install-all
```

## 📋 Update Checklist

Before updating:
- [ ] Save any important work
- [ ] Note any custom configurations you've made
- [ ] Backup your database if needed

After updating:
- [ ] Check if `server/config.env` needs updates
- [ ] Verify the application starts correctly
- [ ] Test basic functionality
- [ ] Check if your custom data is still there

## 💡 Pro Tips

1. **Always backup your work** before updating
2. **Check the commit messages** to see what changed
3. **Read any new documentation** that might be added
4. **Test the application** after updating
5. **Keep your local changes minimal** to avoid conflicts

## 🆘 Need Help?

If you encounter issues during updates:
1. Check the error messages carefully
2. Try the troubleshooting steps above
3. Check the main README.md for new instructions
4. Contact the project maintainer

---

**Remember: Regular updates keep your application secure and up-to-date with the latest features!** 🚀 