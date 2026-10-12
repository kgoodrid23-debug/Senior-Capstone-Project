# Buddiez & Bandz — Capacitor client

This project packages the supplied HTML, CSS, and JavaScript interface as a
Capacitor application. Your frontend remains ordinary HTML/CSS/JavaScript and
your Python/Flask backend remains a separate service inside `backend`.

## Requirements

- Node.js 22 or newer
- Python 3
- Android Studio 2025.2.1 or newer for Android development
- macOS and Xcode are required only if the team later builds the iOS version

## Run the Flask backend and browser version

From the project folder on Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python backend\app.py
```

Then open `http://127.0.0.1:5000`. Flask serves the same files from `www` that
Capacitor packages into the Android application.

## First-time Android setup

From this folder, run:

```powershell
npm install
npm run cap:sync
npm run cap:open:android
```

The Android project is already included. The final command opens it in Android
Studio. Select an emulator or connected Android phone and press Run.

Only use `npm run cap:add:android` if you intentionally remove the included
`android` folder and need to regenerate it.

## Normal development workflow

Edit files inside `www`. After changing HTML, CSS, or JavaScript, run:

```powershell
npm run cap:sync
npm run cap:open:android
```

Commit the generated `android` folder to Git so every teammate uses the same
native configuration. Do not commit `node_modules`.

## Connect to Flask

Edit `www/config.js` to choose the backend address.

The included development default is:

```javascript
NATIVE_API_BASE_URL: "http://10.0.2.2:5000"
```

`10.0.2.2` lets the standard Android emulator reach Flask running on the
development computer. For a physical phone, replace it with the computer's
local-network IP, for example `http://192.168.1.100:5000`. Both devices must be
on the same network, and Flask must listen on an externally reachable address.

For the final deployed application, replace the development address with the
hosted HTTPS Flask URL.

The included Capacitor configuration temporarily permits cleartext and mixed
HTTP content so the Android emulator can call a local Flask server. These
development settings are marked in `capacitor.config.json` and the Android
manifest. Remove `server.cleartext`, `android.allowMixedContent`, and
`android:usesCleartextTraffic="true"` before a production release after
changing the backend address to HTTPS.

## Included pages

- `www/index.html`: converted home/dashboard page
- `www/profile.html`: converted profile page
- `www/events.html`: placeholder for the teammate's Events screen
- `www/people.html`: placeholder for the teammate's People screen
- `www/app.js`: dashboard API request and safe DOM rendering
- `www/data.js`: mock data used when Flask is unavailable
- `www/config.js`: environment-specific API address
- `www/style.css`: supplied styles plus mobile/Capacitor adjustments
- `backend/app.py`: Flask web server and `/api/dashboard` endpoint
- `backend/requirements.txt`: Python dependencies

Replace the two placeholder pages when the actual Events and People screens are
committed.
