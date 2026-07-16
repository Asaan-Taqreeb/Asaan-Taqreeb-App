# Asaan Taqreeb (Easy Event) - Mobile Client

Asaan Taqreeb is a modern, cross-platform event management application that connects clients directly with verified vendors (venues, caterers, decorators, photographers, and salons). 

This repository contains the mobile application built using **React Native (Expo)**, targeting iOS, Android, and Web platforms.

---

## 🛠️ Tech Stack & Key Technologies

*   **Framework:** React Native with [Expo SDK 54](https://docs.expo.dev/) (utilizing File-based routing via `expo-router`).
*   **State & Session:** Context-based state management (`UserContext`, `ThemeContext`, `LanguageContext`, `NotificationContext`).
*   **Media & Sound:** Powered by the modern [expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/) package (replacing the deprecated `expo-av` module) for voice note recordings and playback.
*   **Maps & Geolocation:**
    *   Unified map view with custom Google Maps WebView wrappers and OpenStreetMap/Leaflet fallbacks.
    *   High-accuracy browser geocoding enabled for web platforms using device GPS/Wi-Fi triangulation.
*   **Realtime Communication:** WebSocket integration via `Socket.io-client` for vendor-client instant messaging and consultation scheduling.

---

## 📂 Project Structure

Within `/mobile-app`, the directory layout is structured as follows:

*   **`app/`**: Root app directory containing all views and screens:
    *   **`_auth/`**: Authentication workflows (Login, Registration, OTP Verification, Password Resets).
    *   **`_components/`**: Reusable app components (e.g. `AudioPlayer`, `StatusStepper`, `GoogleMapView`, `LocationPicker`).
    *   **`_constants/`**: Color tokens, typography constants, and [apiEndpoints.ts](file:///home/mirzazain/Documents/Asaan-Taqreeb/Asaan-Taqreeb-App/mobile-app/app/_constants/apiEndpoints.ts).
    *   **`_context/`**: React Context providers (Socket connection, localizations, unread counters).
    *   **`_utils/`**: Core utilities and API clients (Axios/fetch wrappers, date calculation helpers).
    *   **`screens/`**: Primary user interfaces separated by client and vendor dashboards.
*   **`assets/`**: Visual assets (icons, fonts, images).
*   **`scripts/`**: Offline build helper scripts.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (version 18+ recommended) and npm installed.

### 2. Installation
Navigate into the mobile app folder:
```bash
cd mobile-app
npm install
```

### 3. Running the App
*   **Expo Developer Console:**
    ```bash
    npx expo start
    ```
*   **Run on Android Device/Emulator:**
    Press `a` in the terminal or use a physical device scanning the QR code via the Expo Go app.
*   **Run on iOS Simulator:**
    Press `i` in the terminal.
*   **Run in Web Browser:**
    Press `w` in the terminal to compile and run the web build locally.

---

## 🔒 Configuration & API Setup

*   The client points to a unified base URL defined in [apiEndpoints.ts](file:///home/mirzazain/Documents/Asaan-Taqreeb/Asaan-Taqreeb-App/mobile-app/app/_constants/apiEndpoints.ts):
    ```typescript
    export const API_BASE_URL = 'https://asaantaqreeb.duckdns.org';
    ```
*   **Web Geolocation:** Browser geolocation queries utilize device hardware GPS or Wi-Fi triangulation to set default listing area. For security reasons, browser geolocation requires a secure context (**HTTPS**). Over non-secure HTTP networks, it will fall back to local IP/Karachi center default coordinates.
*   **Web Dialog Fallbacks:** Actions like account deletions or booking cancellations check the runtime platform. On web browsers where native `Alert.alert` does not render, they safely trigger web-native `window.confirm` and `window.alert` dialog boxes to maintain feature parity.

---

## 🧪 Testing & Validation

To verify code changes and check for regressions:
*   **Unit Tests:** Run the Jest test suites:
    ```bash
    npm run test
    ```
*   **TypeScript Check:** Compile the codebase:
    ```bash
    npx tsc --noEmit
    ```
*   **Linting Rules:** Run static analysis checks:
    ```bash
    npx eslint --quiet
    ```
