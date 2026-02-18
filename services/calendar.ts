import * as Calendar from 'expo-calendar';

export interface CalendarEvent {
  title: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  location?: string;
  notes?: string;
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/** Returns events for the next N days as a compact string for agent metadata. */
export async function getUpcomingEventsString(days = 1): Promise<string | undefined> {
  try {
    const granted = await requestCalendarPermission();
    if (!granted) return undefined;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calIds = calendars.map((c) => c.id);

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    const events = await Calendar.getEventsAsync(calIds, start, end);
    if (!events.length) return undefined;

    const lines = events.map((e) => {
      const time = new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${time} ${e.title}`;
    });

    return lines.join('; ');
  } catch {
    return undefined;
  }
}
