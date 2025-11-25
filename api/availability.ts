import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = '224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
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

// Helper to refresh access token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  if (!GOOGLE_CLIENT_SECRET) return null;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.access_token;
  } catch {
    return null;
  }
}

// Generate time slots for a given date
function generateTimeSlots(date: string): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  const startHour = 9;
  const endHour = 19;
  const intervalMinutes = 30;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const nextMinute = minute + intervalMinutes;
      const nextHour = nextMinute >= 60 ? hour + 1 : hour;
      const adjustedMinute = nextMinute % 60;

      if (nextHour > endHour || (nextHour === endHour && adjustedMinute > 0)) break;

      const start = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      const end = `${date}T${String(nextHour).padStart(2, '0')}:${String(adjustedMinute).padStart(2, '0')}:00`;

      slots.push({ start, end });
    }
  }

  return slots;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Date parameter required (YYYY-MM-DD)' });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Check if date is a weekday
  const dateObj = new Date(date + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({ date, slots: [] }); // Weekend, no slots
  }

  let accessToken = getAccessToken(req);

  // If no access token, return error
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://diogocoutinho.com/api/auth/google/callback')}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')}&access_type=offline&prompt=consent`
    });
  }

  try {
    // Generate all possible slots
    const allSlots = generateTimeSlots(date);

    // Get busy times from Google Calendar
    const timeMin = `${date}T09:00:00Z`;
    const timeMax = `${date}T19:00:00Z`;

    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: CALENDAR_ID }],
        }),
      }
    );

    if (!freeBusyResponse.ok) {
      throw new Error('Failed to fetch calendar availability');
    }

    const freeBusyData = await freeBusyResponse.json();
    const busyTimes = freeBusyData.calendars?.[CALENDAR_ID]?.busy || [];

    // Mark slots as free or busy
    const slotsWithAvailability = allSlots.map((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      const isBusy = busyTimes.some((busy: { start: string; end: string }) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        // Check if slot overlaps with busy time
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      return {
        start: slot.start,
        end: slot.end,
        free: !isBusy,
      };
    });

    return res.json({
      date,
      slots: slotsWithAvailability,
    });
  } catch (error) {
    console.error('Availability error:', error);
    return res.status(500).json({ error: 'Failed to check availability' });
  }
}


