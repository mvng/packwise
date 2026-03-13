const fs = require('fs');
let code = fs.readFileSync('components/TripPlanningAssistant/TaskCard.tsx', 'utf8');

code = code.replace(
`            {task.reminderAt && (
              <div className="flex items-center gap-1 text-blue-600">
                <Bell className="w-3.5 h-3.5" />
                <span>Reminder: {formatDate(task.reminderAt)}</span>

                <div className="flex items-center gap-0.5 ml-1">
                  {task.reminderTypes.includes('PUSH') && <Bell className="w-3 h-3" />}
                  {task.reminderTypes.includes('SMS') && <Smartphone className="w-3 h-3" />}
                  {task.reminderTypes.includes('CALENDAR') && <CalendarIcon className="w-3 h-3" />}
                </div>
              </div>
            )}`,
`            {/* task.reminderAt block has been removed - Reminders: Coming soon! */}`
);

fs.writeFileSync('components/TripPlanningAssistant/TaskCard.tsx', code);
