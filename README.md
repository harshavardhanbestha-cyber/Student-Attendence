# QR Attendance Register System

A modern, beautiful web-based attendance system with QR code integration and Google Forms.

## Features

✨ **Beautiful Modern UI**
- Glassmorphism design with gradient backgrounds
- Smooth animations and transitions
- Fully responsive layout
- Dark theme with vibrant accents

📱 **QR Code Integration**
- Generates QR code linking to Google Form
- Students scan to register attendance
- Direct form access button

📊 **Live Dashboard**
- Real-time attendance statistics
- Today's attendance count
- Total registered students
- Live clock display

🔍 **Smart Features**
- Search functionality to filter students
- Auto-refresh every 5 seconds
- Manual refresh button
- Timestamp for each entry

## Setup Instructions

### 1. Configure Google Form

1. Create a new Google Form at [forms.google.com](https://forms.google.com)
2. Add the following fields:
   - **Student Name** (Short answer, Required)
   - **Timestamp** (automatically captured)
3. Get your form's shareable link
4. Copy the form URL

### 2. Update Configuration

Open `script.js` and update the `GOOGLE_FORM_URL`:

```javascript
const CONFIG = {
    GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform',
    // ... rest of config
};
```

### 3. Connect to Database (Production)

**Current Setup (Demo):**
- Uses `localStorage` for demonstration
- Data persists in browser only
- Perfect for testing

**For Production:**

You have several options to connect to a real database:

#### Option A: Google Sheets + Apps Script
1. Set up Google Form to save responses to Google Sheets
2. Create a Google Apps Script web app to:
   - Fetch attendance data from Sheets
   - Return as JSON
3. Update `script.js` to fetch from your Apps Script URL

#### Option B: Firebase Realtime Database
1. Create a Firebase project
2. Set up Realtime Database
3. Configure Google Form to send data via webhook
4. Update `script.js` to read from Firebase

#### Option C: Custom Backend
1. Create a backend API (Node.js, Python, PHP, etc.)
2. Set up a database (MySQL, PostgreSQL, MongoDB)
3. Create endpoints to:
   - Receive form submissions
   - Return attendance data
4. Update `script.js` to use your API

### 4. Run the Application

Simply open `index.html` in a web browser:

```bash
# Option 1: Double-click index.html

# Option 2: Use a local server (recommended)
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server

# Then open: http://localhost:8000
```

## Testing

To test the system without a real Google Form:

1. Open the browser console (F12)
2. Run these commands:

```javascript
// Add sample data
addSampleData()

// Add individual record
addAttendanceRecord("John Doe")
```

## File Structure

```
Html2/
├── index.html          # Main HTML structure
├── style.css           # Styling and animations
├── script.js           # JavaScript logic
└── README.md           # This file
```

## Customization

### Change Colors

Edit CSS variables in `style.css`:

```css
:root {
    --primary: #6366f1;      /* Primary color */
    --secondary: #8b5cf6;    /* Secondary color */
    --success: #10b981;      /* Success color */
    /* ... more variables */
}
```

### Change Refresh Interval

Edit `script.js`:

```javascript
const CONFIG = {
    REFRESH_INTERVAL: 5000  // milliseconds (5 seconds)
};
```

### Modify Form Fields

Update the Google Form and adjust the data processing in `script.js` accordingly.

## Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Security Notes

⚠️ **Important for Production:**

1. **Never expose API keys** in frontend code
2. **Validate all inputs** on the backend
3. **Use HTTPS** for production deployment
4. **Implement authentication** if needed
5. **Sanitize data** to prevent XSS attacks

## Deployment

### GitHub Pages
1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Access via: `https://username.github.io/repo-name`

### Netlify/Vercel
1. Connect your repository
2. Deploy with one click
3. Get automatic HTTPS and CDN

## Future Enhancements

- 🔐 Admin authentication
- 📧 Email notifications
- 📈 Analytics and reports
- 📥 Export to CSV/PDF
- 🔔 Late arrival tracking
- 👤 Student profiles with photos
- 📅 Calendar view

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Google Form URL is correct
3. Ensure JavaScript is enabled
4. Test in different browsers

## License

Free to use and modify for educational purposes.

---

**Made with ❤️ for easy attendance tracking**
