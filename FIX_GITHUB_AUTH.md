# Fix GitHub Authentication

The push failed because Git is using cached credentials from the old account.

---

## 🔧 Solution Options

### **Option 1: Use Personal Access Token (Easiest)**

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: `EduLink-Ghana`
   - Select scopes: ✅ `repo` (full control of private repositories)
   - Click "Generate token"
   - **COPY THE TOKEN** (you won't see it again!)

2. **Push with token:**
   ```bash
   git push -u origin main
   ```
   
   When prompted:
   - Username: `griddevconnect`
   - Password: `paste_your_token_here`

---

### **Option 2: Clear Windows Credentials**

1. **Open Windows Credential Manager:**
   - Press `Win + R`
   - Type: `control /name Microsoft.CredentialManager`
   - Press Enter

2. **Remove GitHub credentials:**
   - Click "Windows Credentials"
   - Find entries starting with `git:https://github.com`
   - Click each one → "Remove"

3. **Push again:**
   ```bash
   git push -u origin main
   ```
   
   Enter new credentials when prompted.

---

### **Option 3: Use GitHub CLI (Recommended)**

1. **Install GitHub CLI:**
   ```bash
   winget install GitHub.cli
   ```

2. **Authenticate:**
   ```bash
   gh auth login
   ```
   
   Follow prompts:
   - Choose: GitHub.com
   - Choose: HTTPS
   - Authenticate: Login with a web browser
   - Follow the browser flow

3. **Push:**
   ```bash
   git push -u origin main
   ```

---

### **Option 4: Use SSH (Most Secure)**

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "grid.devconnet@gmail.com"
   ```
   Press Enter for all prompts (use defaults)

2. **Copy public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   Copy the output

3. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Title: `EduLink-Ghana`
   - Paste the key
   - Click "Add SSH key"

4. **Change remote to SSH:**
   ```bash
   git remote set-url origin git@github.com:griddevconnet/EduLink-Ghana.git
   ```

5. **Push:**
   ```bash
   git push -u origin main
   ```

---

## 🎯 Quick Fix (Recommended)

**Use Personal Access Token - It's the fastest!**

1. Create token: https://github.com/settings/tokens
2. Run: `git push -u origin main`
3. Username: `griddevconnect`
4. Password: `your_token`

---

## ✅ After Successful Push

You should see:
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (120/120), done.
Writing objects: 100% (150/150), 250 KB | 5 MB/s, done.
Total 150 (delta 45), reused 0 (delta 0)
remote: Resolving deltas: 100% (45/45), done.
To https://github.com/griddevconnet/EduLink-Ghana.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

Then visit: https://github.com/griddevconnet/EduLink-Ghana

---

## 🆘 Still Having Issues?

**Error: 403 Forbidden**
- Wrong credentials or no access
- Use Personal Access Token

**Error: 401 Unauthorized**
- Invalid credentials
- Generate new token

**Error: Repository not found**
- Check repository name spelling
- Verify repository exists on GitHub

---

**Choose your method and let's push!** 🚀
