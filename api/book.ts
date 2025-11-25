import type { VercelRequest, VercelResponse } from '@vercel/node';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// Helper to get access token from cookies
function getAccessToken(req: VercelRequest): string | null {
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies?.google_access_token || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { start, end, name, email } = req.body;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end time required' });
  }

  const accessToken = getAccessToken(req);

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Create event in Google Calendar
    const event = {
      summary: `Marcação: ${name || 'Cliente'}`,
      description: email ? `Email: ${email}` : 'Marcação via website',
      start: {
        dateTime: start,
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: end,
        timeZone: 'Europe/Lisbon',
      },
      attendees: email ? [{ email }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API error:', error);
      throw new Error('Failed to create event');
    }

    const createdEvent = await response.json();

    return res.json({
      success: true,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}


