# User Permissions Update Fix

## Issue
Users could not update permissions because the API endpoint was not being reached properly.

## Root Cause
The Express.js route ordering in `server/routes/users.js` was incorrect. Routes with specific paths (like `/permissions/available`, `/export`, `/cashiers/list`) were defined **after** the parameterized route `/:id`.

When a request was made to `/api/users/permissions/available`, Express would match it against the `/:id` route first, treating "permissions" as a user ID, which would fail.

## Solution
Reordered the routes in `server/routes/users.js` to ensure all specific path routes are defined **before** parameterized routes:

### Correct Order:
1. `POST /:id/login` (specific POST route)
2. `GET /` (list all users)
3. **`GET /permissions/available`** ✅ (moved up)
4. **`GET /export`** ✅ (moved up)
5. **`GET /cashiers/list`** ✅ (moved up)
6. `GET /:id` (parameterized route)
7. `POST /` (create user)
8. `PUT /:id` (update user)
9. `PATCH /:id/permissions` (update user permissions)
10. `PATCH /:id/toggle-active` (toggle user status)
11. `DELETE /:id` (delete user)

## Key Learning
In Express.js, the order of route definitions matters:
- **Specific routes** (with exact paths) must come before **parameterized routes** (with `:param`)
- Express matches routes in the order they are defined
- The first matching route handler will be executed

## Files Changed
- `server/routes/users.js` - Reordered route definitions

## How to Test
1. Start the server: `npm run dev` (in server directory)
2. Login as Admin
3. Go to Users page
4. Click "Permissions" button on any user
5. The permissions modal should now load properly with all available permissions
6. Select/deselect permissions and click "Update Permissions"
7. Permissions should be saved successfully

## API Endpoints Affected
- ✅ `GET /api/users/permissions/available` - Now works correctly
- ✅ `GET /api/users/export` - Now works correctly  
- ✅ `GET /api/users/cashiers/list` - Now works correctly
- ✅ `PATCH /api/users/:id/permissions` - Works correctly (was working before)

## Status
✅ **FIXED** - User permissions can now be updated successfully

