#!/usr/bin/env node
/**
 * Debug script to check day calculation
 */

import 'dotenv/config';
import * as db from './services/db.js';
import * as planService from './services/planService.js';

console.log('🔍 Debugging Day Calculation\n');

await db.initializeDatabase();

// Get all users
const users = await db.getAllActiveUsers();
console.log(`Found ${users.length} users in memory\n`);

for (const user of users) {
  console.log(`👤 User: ${user.first_name} (${user.telegram_id})`);
  console.log(`   Start Date: ${user.start_date}`);
  console.log(`   Current Date: ${new Date()}`);
  
  const diffTime = new Date() - new Date(user.start_date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  console.log(`   Days since start: ${diffDays}`);
  
  const progress = planService.calculateProgress(user.start_date);
  console.log(`   Calculated: Week ${progress.weekNumber}, Day ${progress.dayNumber}`);
  
  const currentTask = await planService.getCurrentTask(user.start_date);
  console.log(`   Theme: ${currentTask.theme}`);
  console.log(`   Task: ${currentTask.task.task}`);
  console.log('');
}

// Test with manual dates
console.log('\n📅 Test Scenarios:');

console.log('\nScenario 1: Registered today (should be Day 1)');
const today = new Date();
const prog1 = planService.calculateProgress(today);
console.log(`   Start: ${today.toDateString()}`);
console.log(`   Result: Week ${prog1.weekNumber}, Day ${prog1.dayNumber} ✅`);

console.log('\nScenario 2: Registered yesterday (should be Day 2)');
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const prog2 = planService.calculateProgress(yesterday);
console.log(`   Start: ${yesterday.toDateString()}`);
console.log(`   Result: Week ${prog2.weekNumber}, Day ${prog2.dayNumber} ${prog2.dayNumber === 2 ? '✅' : '❌'}`);

console.log('\nScenario 3: Registered 7 days ago (should be Week 2, Day 1)');
const week1Ago = new Date();
week1Ago.setDate(week1Ago.getDate() - 7);
const prog3 = planService.calculateProgress(week1Ago);
console.log(`   Start: ${week1Ago.toDateString()}`);
console.log(`   Result: Week ${prog3.weekNumber}, Day ${prog3.dayNumber} ${prog3.weekNumber === 2 && prog3.dayNumber === 1 ? '✅' : '❌'}`);

process.exit(0);


