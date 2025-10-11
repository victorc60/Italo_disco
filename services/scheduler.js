import cron from 'node-cron';
import * as planService from './planService.js';
import * as wordsService from './wordsService.js';
import * as storyService from './storyService.js';
import * as quizService from './quizService.js';
import * as db from './db.js';

/**
 * Scheduler service for automated daily and weekly tasks
 * Uses node-cron to schedule messages at specific times
 */

let bot = null;
let scheduledJobs = [];

/**
 * Initialize scheduler with Telegram bot instance
 * @param {TelegramBot} botInstance - Telegram bot instance
 */
export function initializeScheduler(botInstance) {
  bot = botInstance;
  console.log('📅 Initializing scheduler...');
  
  // Initialize all services
  wordsService.initializeOpenAI();
  storyService.initializeOpenAI();
  quizService.initializeOpenAI();
  
  return bot;
}

/**
 * Start all scheduled jobs
 */
export function startScheduler() {
  console.log('⏰ Starting scheduled jobs...');
  
  // Morning vocabulary - 8:00 AM every day
  const morningJob = cron.schedule('0 8 * * *', async () => {
    console.log('🌅 Running morning vocabulary task...');
    await sendMorningVocabulary();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  scheduledJobs.push(morningJob);
  
  // Evening story - 8:00 PM every day
  const eveningJob = cron.schedule('0 20 * * *', async () => {
    console.log('🌙 Running evening story task...');
    await sendEveningStory();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  scheduledJobs.push(eveningJob);
  
  // Practice prompt - 9:00 PM every day
  const practiceJob = cron.schedule('0 21 * * *', async () => {
    console.log('✍️ Running practice prompt task...');
    await sendPracticePrompt();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  scheduledJobs.push(practiceJob);
  
  // Weekly quiz - Every Sunday at 7:00 PM
  const quizJob = cron.schedule('0 19 * * 0', async () => {
    console.log('📝 Running weekly quiz task...');
    await sendWeeklyQuiz();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  scheduledJobs.push(quizJob);
  
  console.log('✅ All scheduled jobs started!');
  console.log('   - Morning vocabulary: 08:00 UTC');
  console.log('   - Evening story: 20:00 UTC');
  console.log('   - Practice prompt: 21:00 UTC');
  console.log('   - Weekly quiz: Sunday 19:00 UTC');
}

/**
 * Send morning vocabulary to all active users
 */
async function sendMorningVocabulary() {
  try {
    const users = await db.getAllActiveUsers();
    
    for (const user of users) {
      try {
        // Get user's current task based on their start date
        const currentTask = await planService.getCurrentTask(user.start_date);
        
        if (currentTask.completed) {
          continue; // User completed the program
        }
        
        // Generate vocabulary based on theme and task
        const words = await wordsService.generateDailyWords(
          currentTask.theme,
          currentTask.task.task,
          currentTask.task.focus
        );
        
        // Format and send message
        const message = wordsService.formatWordsMessage(words, '🌅');
        await bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        
        // Save progress
        await db.saveDailyProgress(user.telegram_id, currentTask.weekNumber, currentTask.dayNumber, {
          taskCompleted: false,
          wordsLearned: JSON.stringify(words)
        });
        
        console.log(`✅ Sent morning vocabulary to user ${user.telegram_id}`);
      } catch (error) {
        console.error(`Error sending vocabulary to user ${user.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in morning vocabulary task:', error);
  }
}

/**
 * Send evening story to all active users
 */
async function sendEveningStory() {
  try {
    const users = await db.getAllActiveUsers();
    
    for (const user of users) {
      try {
        const currentTask = await planService.getCurrentTask(user.start_date);
        
        if (currentTask.completed) {
          continue;
        }
        
        // Get vocabulary from the week for story context
        const weekVocab = await db.getWeekVocabulary(user.telegram_id, currentTask.weekNumber);
        
        // Generate story
        const story = await storyService.generateStory(
          currentTask.theme,
          weekVocab.slice(0, 5),
          'beginner'
        );
        
        // Format and send message
        const message = storyService.formatStoryMessage(story);
        await bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        
        // Update progress
        await db.saveDailyProgress(user.telegram_id, currentTask.weekNumber, currentTask.dayNumber, {
          storyRead: true
        });
        
        console.log(`✅ Sent evening story to user ${user.telegram_id}`);
      } catch (error) {
        console.error(`Error sending story to user ${user.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in evening story task:', error);
  }
}

/**
 * Send practice prompt to all active users
 */
async function sendPracticePrompt() {
  try {
    const users = await db.getAllActiveUsers();
    
    for (const user of users) {
      try {
        const currentTask = await planService.getCurrentTask(user.start_date);
        
        if (currentTask.completed) {
          continue;
        }
        
        // Skip on non-practice days (only send on practice/writing days)
        if (!['practice', 'writing'].includes(currentTask.task.focus)) {
          continue;
        }
        
        // Get week vocabulary
        const weekVocab = await db.getWeekVocabulary(user.telegram_id, currentTask.weekNumber);
        
        // Generate practice prompt
        const prompt = await storyService.generatePracticePrompt(currentTask.theme, weekVocab);
        
        // Format and send message
        const message = storyService.formatPracticeMessage(prompt);
        await bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        
        console.log(`✅ Sent practice prompt to user ${user.telegram_id}`);
      } catch (error) {
        console.error(`Error sending practice prompt to user ${user.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in practice prompt task:', error);
  }
}

/**
 * Send weekly quiz to all active users (Sundays)
 */
async function sendWeeklyQuiz() {
  try {
    const users = await db.getAllActiveUsers();
    
    for (const user of users) {
      try {
        const currentTask = await planService.getCurrentTask(user.start_date);
        
        if (currentTask.completed) {
          continue;
        }
        
        // Only send quiz on quiz day (day 7)
        if (currentTask.dayNumber !== 7) {
          continue;
        }
        
        // Get all vocabulary from the week
        const weekVocab = await db.getWeekVocabulary(user.telegram_id, currentTask.weekNumber);
        
        // Generate quiz
        const quiz = await quizService.generateWeeklyQuiz(
          currentTask.weekNumber,
          currentTask.theme,
          weekVocab
        );
        
        // Format and send message
        const message = quizService.formatQuizMessage(quiz);
        await bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        
        console.log(`✅ Sent weekly quiz to user ${user.telegram_id}`);
      } catch (error) {
        console.error(`Error sending quiz to user ${user.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in weekly quiz task:', error);
  }
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  console.log('🛑 Stopping all scheduled jobs...');
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];
  console.log('✅ All scheduled jobs stopped');
}

/**
 * Get scheduler status
 * @returns {Object} Status information
 */
export function getSchedulerStatus() {
  return {
    isRunning: scheduledJobs.length > 0,
    activeJobs: scheduledJobs.length,
    jobs: [
      { name: 'Morning Vocabulary', time: '08:00 UTC', frequency: 'Daily' },
      { name: 'Evening Story', time: '20:00 UTC', frequency: 'Daily' },
      { name: 'Practice Prompt', time: '21:00 UTC', frequency: 'Daily' },
      { name: 'Weekly Quiz', time: '19:00 UTC Sunday', frequency: 'Weekly' }
    ]
  };
}

/**
 * Manually trigger morning vocabulary (for testing)
 */
export async function triggerMorningVocabulary() {
  console.log('🧪 Manually triggering morning vocabulary...');
  await sendMorningVocabulary();
}

/**
 * Manually trigger evening story (for testing)
 */
export async function triggerEveningStory() {
  console.log('🧪 Manually triggering evening story...');
  await sendEveningStory();
}

/**
 * Manually trigger practice prompt (for testing)
 */
export async function triggerPracticePrompt() {
  console.log('🧪 Manually triggering practice prompt...');
  await sendPracticePrompt();
}

/**
 * Manually trigger weekly quiz (for testing)
 */
export async function triggerWeeklyQuiz() {
  console.log('🧪 Manually triggering weekly quiz...');
  await sendWeeklyQuiz();
}

export default {
  initializeScheduler,
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerMorningVocabulary,
  triggerEveningStory,
  triggerPracticePrompt,
  triggerWeeklyQuiz
};

