const fs = require('fs');
let code = fs.readFileSync('components/TripPlanningAssistant/TaskForm.tsx', 'utf8');

code = code.replace(
`        <div>
          <label htmlFor="reminderAt" className="block text-sm font-medium text-gray-700 mb-1">
            Reminder Time
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              id="reminderAt"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {reminderAt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notify via
            </label>
            <div className="flex flex-wrap gap-3">
              <label className={\`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors \${
                reminderTypes.includes('PUSH') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }\`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={reminderTypes.includes('PUSH')}
                  onChange={() => toggleReminderType('PUSH')}
                />
                <Bell className="w-4 h-4" />
                Push Notification
              </label>

              <label className={\`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors \${
                reminderTypes.includes('SMS') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }\`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={reminderTypes.includes('SMS')}
                  onChange={() => toggleReminderType('SMS')}
                />
                <Smartphone className="w-4 h-4" />
                SMS
              </label>

              <label className={\`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors \${
                reminderTypes.includes('CALENDAR') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }\`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={reminderTypes.includes('CALENDAR')}
                  onChange={() => toggleReminderType('CALENDAR')}
                />
                <CalendarIcon className="w-4 h-4" />
                Calendar Invite
              </label>
            </div>
          </div>
        )}`,
`        {/* Reminders: Coming soon! */}
        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Reminders</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-blue-100 text-blue-700 rounded-full ml-auto">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-gray-400">
            SMS, Push, and Calendar notifications are currently disabled and will be available in a future update.
          </p>
        </div>`
);

fs.writeFileSync('components/TripPlanningAssistant/TaskForm.tsx', code);
