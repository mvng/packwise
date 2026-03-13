const fs = require('fs');
let code = fs.readFileSync('components/TripPlanningAssistant/index.tsx', 'utf8');

code = code.replace(
`        if (suggestedReminderAt > new Date()) {
          reminderStr = suggestedReminderAt.toISOString().slice(0, 16)
        } else {
          // If reminder would be in the past, set for next hour
          const soon = new Date()
          soon.setHours(soon.getHours() + 1)
          reminderStr = soon.toISOString().slice(0, 16)
        }`,
`        // Reminders coming soon: statically set to empty
        reminderStr = ''`
);

code = code.replace(
`      reminderAt: reminderStr || null,
      reminderTypes: ['PUSH'],`,
`      reminderAt: null,
      reminderTypes: [],`
);

fs.writeFileSync('components/TripPlanningAssistant/index.tsx', code);
