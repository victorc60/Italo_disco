# 🐛 Bug Fix - User Registration Not Persisting

## Problem

When running the bot **without MySQL** (demo mode), users were getting:
- ✅ Successfully registered with `/start` command
- ❌ But then getting "Please use /start first!" on every message

## Root Cause

In `services/db.js`:
- `registerUser()` was returning a user object in demo mode (good)
- `getUser()` was returning `null` in demo mode (bad)

This meant users were "registered" but immediately forgotten!

```javascript
// BEFORE (BROKEN)
export async function registerUser(telegramId, username, firstName) {
  if (!pool) {
    return { telegram_id: telegramId, ... }; // Returns user
  }
  // ...
}

export async function getUser(telegramId) {
  if (!pool) return null; // ❌ Always returns null!
  // ...
}
```

## Solution

Added **in-memory storage** using JavaScript Maps for demo mode:

```javascript
// AFTER (FIXED)
const inMemoryUsers = new Map();
const inMemoryVocabulary = new Map();

export async function registerUser(telegramId, username, firstName) {
  if (!pool) {
    if (inMemoryUsers.has(telegramId)) {
      return inMemoryUsers.get(telegramId);
    }
    const user = { telegram_id: telegramId, ... };
    inMemoryUsers.set(telegramId, user); // ✅ Save to memory
    return user;
  }
  // ...
}

export async function getUser(telegramId) {
  if (!pool) {
    return inMemoryUsers.get(telegramId) || null; // ✅ Retrieve from memory
  }
  // ...
}
```

## What Was Fixed

Updated the following functions in `services/db.js`:

1. ✅ `registerUser()` - Now saves users to in-memory Map
2. ✅ `getUser()` - Now retrieves users from in-memory Map
3. ✅ `getAllActiveUsers()` - Now returns in-memory users
4. ✅ `saveVocabulary()` - Now saves to in-memory storage
5. ✅ `getWeekVocabulary()` - Now retrieves from in-memory storage

## How It Works Now

### With MySQL (Production)
```
User sends /start
  └─▶ Saved to MySQL database
  └─▶ Retrieved from MySQL on subsequent messages
  └─▶ Persists forever
```

### Without MySQL (Demo Mode)
```
User sends /start
  └─▶ Saved to in-memory Map
  └─▶ Retrieved from Map on subsequent messages
  └─▶ Persists until bot restarts
```

## Testing

Run the test to verify:
```bash
node test.js
```

Expected output:
```
✅ User 123456789 registered in memory (demo mode)
✅ User found: Test User (123456789)
🎉 BUG FIXED! User persists after registration!
```

## Benefits

- ✅ Bot works perfectly without MySQL
- ✅ Users can test immediately without database setup
- ✅ No behavior change when MySQL is configured
- ✅ Vocabulary and progress tracked in memory
- ✅ Multiple users supported simultaneously

## Notes

**Important**: In demo mode (without MySQL), all data is lost when the bot restarts. For production use, configure MySQL in `.env` for permanent storage.

---

**Status**: ✅ Fixed and tested
**Date**: October 11, 2025
**Impact**: Critical - Bot now works in demo mode

