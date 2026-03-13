const fs = require('fs')

// Fix route.ts
let routePath = 'app/api/trips/[id]/tasks/route.ts'
let routeContent = fs.readFileSync(routePath, 'utf8')
routeContent = routeContent.replace('id,', 'tripId: id,')
fs.writeFileSync(routePath, routeContent)

// Fix [taskId]/route.ts
let taskRoutePath = 'app/api/trips/[id]/tasks/[taskId]/route.ts'
let taskRouteContent = fs.readFileSync(taskRoutePath, 'utf8')
taskRouteContent = taskRouteContent.replace(/where: {\n        id: taskId,\n        id,\n/g, 'where: {\n        id: taskId,\n        tripId: id,\n')
fs.writeFileSync(taskRoutePath, taskRouteContent)
