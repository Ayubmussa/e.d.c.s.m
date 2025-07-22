# Elderly Digital Companion

A full-stack application to support elderly care, featuring health tracking, medication reminders, emergency alerts, family/caregiver management, geofencing, brain training, and more.

---

## Project Structure

- **backend/**: Node.js/Express REST API for all app features
- **frontend/**: React Native app for elderly and caregivers

---

## Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Configure environment:**
   - Edit `src/config/database.js` for your database settings
   - Set up any required environment variables (e.g., for email, Twilio, etc.)
3. **Run the server:**
   ```bash
   npm start
   ```
   or with nodemon:
   ```bash
   npm run dev
   ```
4. **API Documentation & Testing:**
   - Import `postman-collection-complete.json` into Postman to test all endpoints

---

## Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Run the app:**
   - For Expo:
     ```bash
     npx expo start
     ```
   - For React Native CLI:
     ```bash
     npx react-native run-android
     # or
     npx react-native run-ios
     ```
3. **Configure API URL:**
   - Edit `src/config/config.js` to point to your backend server

---

## Features
- User authentication (elderly & caregivers)
- Family/caregiver management
- Health check-ins & trends
- Medication management & reminders
- Emergency alerts (manual, fall detection, inactivity)
- Geofencing & safe zones
- Brain training games
- Voice assistant
- Push notifications

---

## API Testing
- Use the provided Postman collection (`backend/postman-collection-complete.json`) for all backend endpoints
- Set `base_url` and authentication variables as needed in Postman

