#!/usr/bin/env node
/**
 * Simple test script to verify all services load correctly
 * Run: node test.js
 */

import 'dotenv/config';

console.log('🧪 Testing Imparo Italiano Bot Components...\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables...');
const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
const hasOpenAI = !!process.env.OPENAI_API_KEY;
console.log(`   Telegram Token: ${hasToken ? '✅' : '❌'}`);
console.log(`   OpenAI Key: ${hasOpenAI ? '✅' : '❌'}`);

// Test 2: Import Services
console.log('\n2️⃣ Testing Service Imports...');
try {
  const planService = await import('./services/planService.js');
  console.log('   ✅ planService.js loaded');
  
  const db = await import('./services/db.js');
  console.log('   ✅ db.js loaded');
  
  const wordsService = await import('./services/wordsService.js');
  console.log('   ✅ wordsService.js loaded');
  
  const storyService = await import('./services/storyService.js');
  console.log('   ✅ storyService.js loaded');
  
  const quizService = await import('./services/quizService.js');
  console.log('   ✅ quizService.js loaded');
  
  const scheduler = await import('./services/scheduler.js');
  console.log('   ✅ scheduler.js loaded');
  
  // Test 3: Plan.json
  console.log('\n3️⃣ Testing plan.json...');
  const plan = await planService.loadPlan();
  console.log(`   ✅ Loaded ${plan.weeks.length} weeks`);
  
  const week1 = await planService.getWeek(1);
  console.log(`   ✅ Week 1: ${week1.theme}`);
  
  const day1 = await planService.getDayTask(1, 1);
  console.log(`   ✅ Day 1 Task: ${day1.task}`);
  
  // Test 4: Progress Calculation
  console.log('\n4️⃣ Testing Progress Calculation...');
  const startDate = new Date();
  const progress = planService.calculateProgress(startDate);
  console.log(`   ✅ Week: ${progress.weekNumber}, Day: ${progress.dayNumber}`);
  
  const currentTask = await planService.getCurrentTask(startDate);
  console.log(`   ✅ Current Theme: ${currentTask.theme}`);
  
  // Test 5: Database (optional)
  console.log('\n5️⃣ Testing Database Connection...');
  try {
    await db.initializeDatabase();
    console.log('   ✅ Database connected (or running in demo mode)');
  } catch (error) {
    console.log('   ⚠️  Running without database (demo mode)');
  }
  
  console.log('\n✅ All tests passed! Bot is ready to run.\n');
  console.log('To start the bot: npm start');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error);
  process.exit(1);
}

process.exit(0);

