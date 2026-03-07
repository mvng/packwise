# Luggage Feature Tests

## Overview

Comprehensive E2E tests for the luggage management feature.

## Test Coverage

### 1. Luggage Management (`/luggage`)
- ✅ Display luggage page
- ✅ Create new luggage item
- ✅ Delete luggage item
- ✅ Display correct icons for each luggage type

### 2. Trip Luggage Selection
- ✅ Display luggage selector on trip page
- ✅ Select luggage for trip
- ✅ Unselect luggage from trip
- ✅ Show "Add Luggage" prompt when no luggage exists
- ✅ Navigate to luggage management

### 3. Item Assignment
- ✅ Display luggage dropdown for packing items
- ✅ Assign item to luggage
- ✅ Unassign item from luggage
- ✅ Only show selected luggage in dropdown
- ✅ Display luggage icon next to assigned items

### 4. Navigation
- ✅ Navigate to luggage from inventory page
- ✅ Navigate to luggage from trip page

## Running Tests

### Install Playwright (if not installed)
```bash
npm install -D @playwright/test
npx playwright install
```

### Run all tests
```bash
npx playwright test tests/luggage.test.ts
```

### Run specific test suite
```bash
# Luggage management only
npx playwright test tests/luggage.test.ts -g "Luggage Management"

# Item assignment only
npx playwright test tests/luggage.test.ts -g "Item Assignment"
```

### Run in UI mode (interactive)
```bash
npx playwright test tests/luggage.test.ts --ui
```

### Run in headed mode (see browser)
```bash
npx playwright test tests/luggage.test.ts --headed
```

## Test Data Setup

Tests assume:
- User is authenticated
- At least one trip exists ("Test Trip")
- Database is seeded with test data

### Seed test data
```bash
npm run test:seed
```

## Manual Test Checklist

If automated tests fail, verify manually:

### Luggage Library (`/luggage`)
- [ ] Page loads without errors
- [ ] "+ Add Luggage" button works
- [ ] Form validation works (required name)
- [ ] All luggage types available in dropdown
- [ ] Capacity field accepts numbers
- [ ] Luggage card displays correctly
- [ ] Delete button works
- [ ] Icons display for each type

### Trip Page
- [ ] Luggage selector appears
- [ ] Can check/uncheck luggage
- [ ] Selected luggage persists on reload
- [ ] "Manage →" link navigates to `/luggage`
- [ ] Shows prompt when no luggage exists

### Packing List
- [ ] Dropdown appears for each item
- [ ] Only selected luggage shows in dropdown
- [ ] "No bag" option works
- [ ] Icon appears next to assigned items
- [ ] Assignment persists on reload

### Navigation
- [ ] "🧳 Luggage" button on `/inventory` works
- [ ] All luggage links work

## Common Issues

### Tests fail with "element not found"
- Ensure dev server is running: `npm run dev`
- Check if selectors match current UI
- Verify database has test data

### Icons not displaying
- Check emoji support in test environment
- Verify Unicode rendering

### Dropdowns not working
- Ensure luggage is selected for trip first
- Check if luggage exists in database

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run Luggage Tests
  run: |
    npm run build
    npm run test:luggage
```
