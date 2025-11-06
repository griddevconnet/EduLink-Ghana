# EduLink Teacher App - Setup Guide

Complete setup instructions for the React Native mobile app.

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js 18+** installed
- ✅ **npm** or **yarn** package manager
- ✅ **Expo CLI** (will be installed with dependencies)
- ✅ **Expo Go** app on your phone (for testing)

---

## 🚀 Installation Steps

### Step 1: Navigate to Project

```bash
cd teacher-app
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Native
- Expo
- React Navigation
- React Native Paper (UI library)
- Axios (API calls)
- AsyncStorage (offline storage)

**Note:** First installation may take 5-10 minutes.

### Step 3: Start Development Server

```bash
npm start
```

You'll see a QR code in the terminal!

---

## 📱 Running on Your Phone

### Option 1: Expo Go (Easiest)

1. **Install Expo Go** on your phone:
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Scan QR Code:**
   - Android: Use Expo Go app to scan
   - iOS: Use Camera app to scan

3. **App loads on your phone!** 🎉

### Option 2: Android Emulator

```bash
npm run android
```

**Requirements:**
- Android Studio installed
- Android emulator running

### Option 3: iOS Simulator (Mac only)

```bash
npm run ios
```

**Requirements:**
- Xcode installed
- iOS simulator running

---

## 🧪 Testing the App

### Test Credentials

Use these credentials to test (or register new account):

**Email:** `test@edulink.gh`  
**Password:** `Test123!`

### Test Flow

1. **Login** with test credentials
2. **View Dashboard** - See student statistics
3. **Navigate to Students** - View student list
4. **Mark Attendance** - Test attendance marking
5. **View Profile** - See teacher info

---

## 🔗 API Configuration

The app connects to your live backend:

**Backend URL:**
```
https://edulink-backend-07ac.onrender.com
```

**AI Service URL:**
```
https://edulink-ai-service.onrender.com
```

These are configured in `src/services/api.js`

---

## 📁 Project Structure

```
teacher-app/
├── App.js                      # Main entry point
├── app.json                    # Expo configuration
├── package.json                # Dependencies
│
├── src/
│   ├── context/
│   │   └── AuthContext.js      # Authentication state
│   │
│   ├── navigation/
│   │   └── AppNavigator.js     # Navigation setup
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── students/
│   │   │   ├── StudentsScreen.js
│   │   │   └── StudentDetailScreen.js
│   │   ├── attendance/
│   │   │   └── AttendanceScreen.js
│   │   ├── HomeScreen.js
│   │   └── ProfileScreen.js
│   │
│   ├── services/
│   │   └── api.js              # API calls
│   │
│   └── theme.js                # App theme/colors
│
└── assets/                     # Images, icons
```

---

## 🎨 Features Implemented

### ✅ Phase 1: Core Setup
- App structure
- Navigation (Stack + Tabs)
- Theme configuration
- API service layer

### ✅ Phase 2: Authentication
- Login screen
- Register screen
- Auth context
- Token management
- Persistent login

### ✅ Phase 3: Dashboard
- Home screen
- Statistics cards
- Quick actions
- Pull to refresh

### 🔄 Phase 4: Students (In Progress)
- Student list
- Student details
- Search & filter
- Add new student

### 🔄 Phase 5: Attendance (In Progress)
- Mark attendance
- Bulk attendance
- Attendance history
- Follow-up tracking

### 🔄 Phase 6: Offline Mode (Planned)
- Local data storage
- Sync when online
- Offline indicators

---

## 🐛 Troubleshooting

### Metro Bundler Won't Start

```bash
npm start -- --clear
```

### Dependencies Issues

```bash
rm -rf node_modules
npm install
```

### Can't Connect to Expo Go

**Solution 1:** Make sure phone and computer are on same WiFi

**Solution 2:** Use tunnel mode:
```bash
npm start -- --tunnel
```

### App Crashes on Startup

1. Check terminal for error messages
2. Make sure all dependencies are installed
3. Try clearing cache: `npm start -- --clear`

### API Connection Issues

1. Check if backend is running
2. Verify API URLs in `src/services/api.js`
3. Check internet connection

---

## 📦 Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### iOS App (Mac only)

```bash
eas build --platform ios --profile preview
```

---

## 🎯 Next Steps

### Immediate Tasks

1. ✅ Install dependencies
2. ✅ Start development server
3. ✅ Test on phone with Expo Go
4. ✅ Test login/authentication

### Development Tasks

1. Complete remaining screens:
   - Students list
   - Student details
   - Attendance marking
   - Profile screen

2. Add offline functionality:
   - AsyncStorage integration
   - Sync mechanism
   - Offline indicators

3. Polish UI/UX:
   - Loading states
   - Error handling
   - Success messages
   - Animations

4. Testing:
   - Test all features
   - Test offline mode
   - Test on different devices

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

## 🆘 Need Help?

**Common Commands:**

```bash
# Start app
npm start

# Clear cache
npm start -- --clear

# Run on Android
npm run android

# Run on iOS
npm run ios

# Install dependencies
npm install

# Update dependencies
npm update
```

---

**Ready to build!** 🚀

Run `npm install` then `npm start` to begin!
