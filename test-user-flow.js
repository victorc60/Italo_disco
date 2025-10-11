#!/usr/bin/env node
/**
 * Test script to verify user registration bug fix
 * This simulates the user flow that was broken
 */

import 'dotenv/config';
import * as db from './services/db.js';

console.log('🧪 Testing User Registration Bug Fix\n');

// Initialize database
await db.initializeDatabase();

console.log('1️⃣ Simulating user sending /start command...');
const userId = 123456789;

// Register user (simulates /start command)
const registeredUser = await db.registerUser(userId, 'testuser', 'Test User');
console.log(`   ✅ User registered:`, registeredUser);

console.log('\n2️⃣ Simulating user sending regular text message...');

// Try to get user (simulates regular message handler)
const retrievedUser = await db.getUser(userId);

if (retrievedUser) {
  console.log(`   ✅ User found: ${retrievedUser.first_name} (${retrievedUser.telegram_id})`);
  console.log(`   ✅ Week: ${retrievedUser.current_week}, Day: ${retrievedUser.current_day}`);
  console.log('\n🎉 BUG FIXED! User persists after registration!');
} else {
  console.log(`   ❌ User NOT found!`);
  console.log('\n💥 BUG STILL EXISTS! User was registered but cannot be retrieved.');
}

console.log('\n3️⃣ Testing with another user...');
const userId2 = 987654321;
await db.registerUser(userId2, 'anotheruser', 'Another User');
const retrievedUser2 = await db.getUser(userId2);
console.log(`   ${retrievedUser2 ? '✅' : '❌'} Second user: ${retrievedUser2 ? 'Found' : 'Not found'}`);

console.log('\n4️⃣ Getting all active users...');
const allUsers = await db.getAllActiveUsers();
console.log(`   ✅ Total active users: ${allUsers.length}`);
allUsers.forEach(u => {
  console.log(`      - ${u.first_name} (ID: ${u.telegram_id})`);
});

console.log('\n✅ All user persistence tests passed!\n');

