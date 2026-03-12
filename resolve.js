const fs = require('fs');
let file = fs.readFileSync('actions/trip.actions.ts', 'utf8');

file = file.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, '');
file = file.replace(/>>>>>>> origin\/main\n/g, '');

const searchBlock = `    for (const sourceList of sourceTrip.packingLists) {
      const newList = await prisma.packingList.create({
        data: { tripId: newTrip.id, name: sourceList.name }
      })

      for (const sourceCategory of sourceList.categories) {
        const newCategory = await prisma.category.create({
          data: { packingListId: newList.id, name: sourceCategory.name, order: sourceCategory.order }
        })

        for (const sourceItem of sourceCategory.items) {
          const isPacked = localStorageState?.[sourceItem.id] ?? false
          await prisma.packingItem.create({
            data: {
              categoryId: newCategory.id,
              name: sourceItem.name,
              quantity: sourceItem.quantity,
              isPacked,
              isCustom: sourceItem.isCustom,
              order: sourceItem.order
            }
          })
        }
      }
    }

`;
file = file.replace(searchBlock, '');

fs.writeFileSync('actions/trip.actions.ts', file);
