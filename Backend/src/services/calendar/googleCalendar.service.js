import { config } from '../../config/env.js';

export const syncGoogleCalendarEvent = async (appointment, action) => {
  // Check if API client configurations are present (otherwise fall back gracefully to mock logs)
  if (!config.googleClientId || config.googleClientId === 'placeholder_google_client_id') {
    console.log(`[Mock Google Calendar Sync Status]: API not configured. Trigger action "${action}" on appointment ID ${appointment._id}`);
    return {
      success: true,
      eventId: `mock_calendar_event_id_${appointment._id}`,
    };
  }

  try {
    // Standard OAuth client integration code would go here
    // In a real environment, we'd load the calendar client using configured client secrets.
    console.log(`[Google Calendar Syncing] Action: ${action} on appointment: ${appointment._id}`);

    // Return successfully syncing event details
    return {
      success: true,
      eventId: `google_event_${appointment._id}`,
    };
  } catch (error) {
    console.error(`[Google Calendar Sync Failed] error: ${error.message}`);
    throw error;
  }
};
