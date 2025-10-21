import cron from 'node-cron';
import * as db from './db.js';
import * as planService from './planService.js';

/**
 * Scheduler Service - Handles scheduled tasks and daily message delivery
 * Sends daily learning tasks every morning at 8:00 UTC
 */

let bot = null;
let scheduledJobs = new Map();

/**
 * Initialize the scheduler with bot instance
 * @param {TelegramBot} botInstance - Telegram bot instance
 */
export function initializeScheduler(botInstance) {
  bot = botInstance;
  console.log('✅ Scheduler initialized with bot instance');
}

/**
 * Start all scheduled jobs
 */
export function startScheduler() {
  if (!bot) {
    console.error('❌ Scheduler not initialized with bot instance');
    return;
  }

  // Morning daily task delivery - 8:00 UTC
  const morningTask = cron.schedule('0 8 * * *', async () => {
    console.log('🌅 Running morning task scheduler...');
    await sendDailyTasks();
  }, {
    scheduled: false,
    timezone: 'UTC'
  });

  // Evening reminder - 20:00 UTC
  const eveningReminder = cron.schedule('0 20 * * *', async () => {
    console.log('🌙 Running evening reminder scheduler...');
    await sendEveningReminders();
  }, {
    scheduled: false,
    timezone: 'UTC'
  });

  // Weekly quiz reminder - Sunday 19:00 UTC
  const weeklyQuiz = cron.schedule('0 19 * * 0', async () => {
    console.log('📚 Running weekly quiz scheduler...');
    await sendWeeklyQuizReminders();
  }, {
    scheduled: false,
    timezone: 'UTC'
  });

  // Store jobs for management
  scheduledJobs.set('morningTask', morningTask);
  scheduledJobs.set('eveningReminder', eveningReminder);
  scheduledJobs.set('weeklyQuiz', weeklyQuiz);

  // Start all jobs
  morningTask.start();
  eveningReminder.start();
  weeklyQuiz.start();

  console.log('✅ All scheduled jobs started');
  console.log('📅 Morning tasks: 08:00 UTC daily');
  console.log('🌙 Evening reminders: 20:00 UTC daily');
  console.log('📚 Weekly quiz: Sunday 19:00 UTC');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  console.log('🛑 Stopping all scheduled jobs...');
  
  scheduledJobs.forEach((job, name) => {
    job.stop();
    console.log(`✅ Stopped ${name} job`);
  });
  
  scheduledJobs.clear();
  console.log('✅ All scheduled jobs stopped');
}

/**
 * Send daily tasks to all active users
 */
async function sendDailyTasks() {
  try {
    console.log('📤 Sending daily tasks to all users...');
    
    const users = await db.getAllActiveUsers();
    console.log(`Found ${users.length} active users`);
    
    for (const user of users) {
      try {
        await sendDailyTaskToUser(user);
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending daily task to user ${user.user_id}:`, error);
      }
    }
    
    console.log('✅ Daily tasks sent to all users');
  } catch (error) {
    console.error('❌ Error in sendDailyTasks:', error);
  }
}

/**
 * Send daily task to a specific user
 * @param {Object} user - User object
 */
async function sendDailyTaskToUser(user) {
  try {
    const currentTask = planService.getCurrentTask(user.start_date);
    
    if (currentTask.completed) {
      await sendCompletionMessage(user);
      return;
    }
    
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );
    
    const message = formatDailyTaskMessage(dailyPlan, currentTask);
    
    await bot.sendMessage(user.user_id, message, { parse_mode: 'Markdown' });
    
    console.log(`✅ Daily task sent to user ${user.user_id} (Week ${currentTask.weekNumber}, Day ${currentTask.dayNumber})`);
    
  } catch (error) {
    console.error(`Error sending daily task to user ${user.user_id}:`, error);
  }
}

/**
 * Send evening reminders to users who haven't completed today's task
 */
async function sendEveningReminders() {
  try {
    console.log('🌙 Sending evening reminders...');
    
    const users = await db.getAllActiveUsers();
    
    for (const user of users) {
      try {
        const currentTask = planService.getCurrentTask(user.start_date);
        
        if (currentTask.completed) continue;
        
        // Check if user completed today's task
        const todayProgress = await db.getDailyProgress(
          user.user_id, 
          currentTask.weekNumber, 
          currentTask.dayNumber
        );
        
        if (!todayProgress || !todayProgress.taskCompleted) {
          await sendEveningReminder(user, currentTask);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending evening reminder to user ${user.user_id}:`, error);
      }
    }
    
    console.log('✅ Evening reminders sent');
  } catch (error) {
    console.error('❌ Error in sendEveningReminders:', error);
  }
}

/**
 * Send weekly quiz reminders
 */
async function sendWeeklyQuizReminders() {
  try {
    console.log('📚 Sending weekly quiz reminders...');
    
    const users = await db.getAllActiveUsers();
    
    for (const user of users) {
      try {
        const currentTask = planService.getCurrentTask(user.start_date);
        
        if (currentTask.completed || currentTask.dayNumber !== 7) continue;
        
        const message = `📚 *Weekly Quiz Time!* 📚

This week's theme: *${currentTask.theme}*

Time to test your knowledge! Take the weekly quiz to see how much you've learned.

Type /quiz to start your quiz! 🎯

Good luck! In bocca al lupo! 🍀`;

        await bot.sendMessage(user.user_id, message, { parse_mode: 'Markdown' });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending quiz reminder to user ${user.user_id}:`, error);
      }
    }
    
    console.log('✅ Weekly quiz reminders sent');
  } catch (error) {
    console.error('❌ Error in sendWeeklyQuizReminders:', error);
  }
}

/**
 * Send evening reminder to a specific user
 * @param {Object} user - User object
 * @param {Object} currentTask - Current task information
 */
async function sendEveningReminder(user, currentTask) {
  const message = `🌙 *Evening Reminder*

Don't forget about today's Italian lesson!

*Week ${currentTask.weekNumber}, Day ${currentTask.dayNumber}*
*Theme:* ${currentTask.theme}

Type /today to get your lesson, or /status to check your progress.

Keep up the great work! 💪🇮🇹`;

  await bot.sendMessage(user.user_id, message, { parse_mode: 'Markdown' });
}

/**
 * Send completion message to user
 * @param {Object} user - User object
 */
async function sendCompletionMessage(user) {
  const message = `🎉 *Congratulations!* 🎉

You have completed the entire 12-week Imparo Italiano program!

*Bravissimo!* You've learned so much Italian. Keep practicing and continue your journey with the beautiful Italian language.

Thank you for being part of this learning adventure! 🇮🇹✨

*Arrivederci e buona fortuna!* (Goodbye and good luck!)`;

  await bot.sendMessage(user.user_id, message, { parse_mode: 'Markdown' });
}

/**
 * Format daily task message
 * @param {Object} dailyPlan - Daily plan object
 * @param {Object} currentTask - Current task information
 * @returns {string} Formatted message
 */
function formatDailyTaskMessage(dailyPlan, currentTask) {
  return `🌅 *Buongiorno! Good morning!* 🇮🇹

*Week ${dailyPlan.weekNumber}, Day ${dailyPlan.dayNumber}*
*Theme:* ${dailyPlan.theme}

📚 *Today's Focus:* ${dailyPlan.focus}
⏱️ *Estimated Time:* ${dailyPlan.estimatedTime}

*Your Task:*
${dailyPlan.description}

*Exercises:*
${dailyPlan.exercises.map(ex => `• ${ex.description}`).join('\n')}

*Commands:*
/today - Get detailed lesson
/status - Check your progress
/week - See this week's plan
/vocab - Get vocabulary
/quiz - Practice quiz

*Buono studio!* (Happy studying!) 📖✨

Remember: Consistency is key to learning Italian! 💪`;
}

/**
 * Send immediate daily task to a user (for testing or manual triggers)
 * @param {number} userId - User ID
 */
export async function sendImmediateDailyTask(userId) {
  try {
    const user = await db.getUser(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return;
    }
    
    await sendDailyTaskToUser(user);
  } catch (error) {
    console.error(`Error sending immediate daily task to user ${userId}:`, error);
  }
}
