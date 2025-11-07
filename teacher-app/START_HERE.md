# 🚀 Quick Start Guide

## ✅ Step-by-Step Instructions

### 1. Open Terminal in this folder

```bash
cd c:\Users\damed\Desktop\EduLink\teacher-app
```

### 2. Start the app

```bash
npm start
```

**OR** double-click `start-app.bat`

### 3. Wait for QR code

You'll see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### 4. Scan QR code with your phone

- **Android**: Open Expo Go app → Scan QR
- **iOS**: Open Camera app → Scan QR → Tap notification

### 5. App loads on your phone! 🎉

---

## 🐛 Troubleshooting

### Problem: "TypeScript dependencies" prompt

**Solution:** Press **"n"** (No) when asked

### Problem: Port 8081 already in use

**Solution:**
```bash
npx expo start --port 8082
```

### Problem: Metro bundler stuck

**Solution:**
```bash
npm start -- --clear
```

### Problem: App won't load on phone

**Solutions:**
1. Make sure phone and computer are on same WiFi
2. Try tunnel mode:
   ```bash
   npm start -- --tunnel
   ```
3. Check firewall isn't blocking port 8081

### Problem: "Cannot find module" errors

**Solution:**
```bash
rm -rf node_modules
npm install
npm start
```

---

## 📱 What You Should See

**On Computer:**
- Metro bundler running
- QR code displayed
- "Waiting for connection..."

**On Phone:**
- Green screen with Ghana flag 🇬🇭
- "EduLink Teacher" title
- "Loading app..." text
- Spinner animation

---

## 🎯 Current Status

**App Mode:** Simple test version  
**Features:** Basic UI test (no navigation yet)  
**Purpose:** Verify Expo setup works

Once this loads successfully, we'll add back:
- Navigation
- Authentication
- Full features

---

## 🆘 Still Having Issues?

Try these in order:

1. **Clear everything:**
   ```bash
   rm -rf node_modules .expo
   npm install
   npm start -- --clear
   ```

2. **Use web version:**
   ```bash
   npm start
   # Then press 'w' for web
   ```

3. **Check Expo Go app:**
   - Make sure it's latest version
   - Try uninstall/reinstall

---

**Next:** Once you see the green screen on your phone, we'll restore the full app! 🚀
