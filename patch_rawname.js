const fs = require('fs');
let code = fs.readFileSync('components/PackingListSection.tsx', 'utf8');

code = code.replace(
`    if (!name) return
    setAddError(null)

    let displayName = rawName
    let assigneeInitial = null
    const assigneeMatch = rawName.match(/@(\\w+)/)

    if (assigneeMatch) {
      assigneeInitial = assigneeMatch[1].charAt(0).toUpperCase()
      displayName = rawName.replace(assigneeMatch[0], '').trim() || assigneeMatch[1]
    }`,
`    if (!name) return
    setAddError(null)

    let displayName = name
    let assigneeInitial = null
    const assigneeMatch = name.match(/@(\\w+)/)

    if (assigneeMatch) {
      assigneeInitial = assigneeMatch[1].charAt(0).toUpperCase()
      displayName = name.replace(assigneeMatch[0], '').trim() || assigneeMatch[1]
    }`
);

fs.writeFileSync('components/PackingListSection.tsx', code);
