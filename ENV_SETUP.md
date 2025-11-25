# Environment Configuration

## Google Calendar API Setup

### Required Environment Variables

Create a `.env.local` file in the root of your project with:

```env
# Google OAuth2 Client Secret
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Optional: Specify which calendar to use (defaults to "primary")
GOOGLE_CALENDAR_ID=primary
```

### Getting Your Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if not done
6. Set Authorized redirect URIs:
   - `https://diogocoutinho.com/api/auth/google/callback`
   - `http://localhost:8080/api/auth/google/callback` (for development)
7. Copy the Client Secret and add to your `.env.local` file

### Client ID (Already in Code)

```
224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com
```

### Required Scopes

The application requests:
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar events
- `https://www.googleapis.com/auth/calendar.events` - Create calendar events

### Deployment

For Vercel:
1. Go to your project settings
2. Add environment variables:
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_ID` (optional)
3. Redeploy


