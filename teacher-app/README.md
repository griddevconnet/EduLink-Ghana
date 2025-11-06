# EduLink Teacher Mobile App

React Native mobile app for teachers built with Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- Expo Go app on your phone (for testing)

### Installation

```bash
# Install dependencies
npm install

# Start the app
npm start
```

### Run on Device

1. Install **Expo Go** app on your phone
2. Scan the QR code from terminal
3. App will load on your device!

### Run on Emulator

```bash
# Android
npm run android

# iOS (Mac only)
npm run ios
```

## 📱 Features

- ✅ Teacher login/authentication
- ✅ Student list & search
- ✅ Attendance marking (bulk & individual)
- ✅ Learning assessments
- ✅ View risk scores
- ✅ Offline-first functionality
- ✅ Sync when online

## 🛠️ Tech Stack

- React Native (Expo)
- JavaScript (ES6+)
- React Navigation
- React Native Paper (UI)
- AsyncStorage (offline storage)
- Axios (API calls)

## 📁 Project Structure

```
teacher-app/
├── App.js                 # Main entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── src/
│   ├── context/          # React Context (Auth)
│   ├── navigation/       # Navigation setup
│   ├── screens/          # App screens
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── utils/            # Helper functions
│   └── theme.js          # App theme
└── assets/               # Images, icons
```

## 🔗 API Endpoints

**Backend:**
```
https://edulink-backend-07ac.onrender.com
```

**AI Service:**
```
https://edulink-ai-service.onrender.com
```

## 📝 Next Steps

1. Install dependencies: `npm install`
2. Start development: `npm start`
3. Test on your phone with Expo Go
4. Build screens and features
5. Test offline functionality
6. Build APK for distribution

## 🆘 Troubleshooting

**Metro bundler won't start:**
```bash
npm start -- --clear
```

**Dependencies issues:**
```bash
rm -rf node_modules
npm install
```

**Expo Go connection issues:**
- Make sure phone and computer are on same WiFi
- Try tunnel mode: `npm start -- --tunnel`

## 📚 Documentation

- [Expo Docs](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)

---

**Built with ❤️ for Ghana's teachers**
