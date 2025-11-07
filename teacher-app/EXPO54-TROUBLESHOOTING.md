# Expo SDK 54 Troubleshooting Guide

## 🔧 Current Issue: babel-preset-expo Missing

### Quick Fix Commands:
```bash
# 1. Clean everything
npm cache clean --force
rm -rf node_modules package-lock.json

# 2. Install dependencies
npm install

# 3. Fix Expo dependencies
npx expo install --fix

# 4. Start with clear cache
npx expo start --clear
```

### Alternative Fix:
```bash
# If the above doesn't work, try:
npx expo install babel-preset-expo@~12.0.0
npx expo start --clear --reset-cache
```

## 📦 Updated Dependencies for SDK 54:

### Core Dependencies:
- `expo`: ~54.0.0
- `react`: 18.3.1
- `react-native`: 0.76.5

### Dev Dependencies Added:
- `babel-preset-expo`: ~12.0.0
- `@expo/metro-config`: ~0.19.0

## 🚨 Common Issues & Solutions:

### 1. Babel Preset Missing
**Error**: `Cannot find module 'babel-preset-expo'`
**Solution**: Added to devDependencies, run `npm install`

### 2. Metro Config Issues
**Error**: Metro bundler errors
**Solution**: Updated metro.config.js with proper Expo config

### 3. Navigation Issues
**Error**: Navigation v7 breaking changes
**Solution**: Updated to compatible versions

### 4. AsyncStorage Issues
**Error**: AsyncStorage v2 compatibility
**Solution**: Updated to ~2.1.0

## 🎯 Verification Steps:

1. Check package.json has all required dependencies
2. Verify babel.config.js uses 'babel-preset-expo'
3. Ensure metro.config.js uses getDefaultConfig
4. Clear all caches before starting

## 📱 Expected Versions After Fix:
- Expo SDK: 54.0.0
- React Native: 0.76.5
- React: 18.3.1
- Navigation: v7.x
- All Expo packages: v14.x

## 🔄 If Issues Persist:

1. Delete node_modules and package-lock.json
2. Run `npm install` fresh
3. Run `npx expo doctor` to check for issues
4. Use `npx expo start --tunnel` if local network issues
5. Try `npx create-expo-app --template` for comparison

## 📞 Support:
- Expo Documentation: https://docs.expo.dev/
- React Navigation v7: https://reactnavigation.org/docs/7.x/getting-started
