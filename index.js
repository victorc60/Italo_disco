import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import * as db from './services/db.js';
import * as planService from './services/planService.js';
import * as wordsService from './services/wordsService.js';
import * as storyService from './services/storyService.js';
import * as quizService from './services/quizService.js';
import * as scheduler from './services/scheduler.js';

/**
 * Imparo Italiano - Italian Learning Telegram Bot
 * Main entry point with structured 12-week curriculum
 */

// Verify environment variables are loaded
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN?.trim(), { polling: true });

// Initialize OpenAI services
wordsService.initializeOpenAI();
storyService.initializeOpenAI();
quizService.initializeOpenAI();

// Store user conversation context
const userContext = new Map();

/**
 * Initialize the bot and all services
 */
async function initialize() {
  try {
    // Initialize database
    await db.initializeDatabase();
    
    // Initialize scheduler with bot instance
    scheduler.initializeScheduler(bot);
    
    // Start scheduled jobs
    scheduler.startScheduler();
    
    console.log('🤖 Imparo Italiano Bot is running...');
    console.log('Bot is ready to help users learn Italian! 🇮🇹');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    process.exit(1);
  }
}

// Command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  const firstName = msg.from.first_name;

  try {
    // Register or get user
    const user = await db.registerUser(userId, username, firstName);
    
    const welcomeMessage = `
🇮🇹 *Benvenuto! Welcome to Imparo Italiano!* 🇮🇹

${firstName}, I'm your AI-powered Italian learning assistant with a structured 12-week curriculum!

📚 *How it works:*
• *08:00 UTC* - Daily vocabulary (5 words)
• *20:00 UTC* - Evening story using today's words
• *21:00 UTC* - Practice exercises
• *Sunday 19:00 UTC* - Weekly quiz

📖 *12-Week Curriculum:*
Week 1: Greetings and Basic Phrases
Week 2: Numbers and Dates
Week 3: Family and Relationships
Week 4: Daily Routine
...and much more!

*Available Commands:*
/start - Show this message
/status - Check your progress
/today - Get today's lesson
/week - See this week's plan
/quiz - Practice with a quiz
/vocab - Get vocabulary
/help - Get help

*Ready to start your Italian journey?*
Type /today to begin! 🚀

_Note: Messages are sent at specific times each day. You can also request content anytime using commands!_
`;
    
    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /start:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /status - Show user's progress
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await db.getUser(userId);
    
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first to begin your journey!');
      return;
    }

    const currentTask = await planService.getCurrentTask(user.start_date);
    
    if (currentTask.completed) {
      await bot.sendMessage(chatId, '🎉 Congratulations! You have completed the entire 12-week program! Bravissimo!');
      return;
    }

    const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
    
    const statusMessage = `
📊 *Your Learning Progress*

*Week ${currentTask.weekNumber} of 12* - ${currentTask.theme}
*Day ${currentTask.dayNumber} of 7*
*Total Days:* ${currentTask.totalDays}

*Today's Focus:* ${currentTask.task.focus}
*Today's Task:* ${currentTask.task.task}

*This Week:*
📖 Vocabulary learned: ${weekVocab.length} words
🎯 Theme: ${currentTask.theme}

*Keep going!* 💪
Type /today to get today's lesson or /week to see the full week plan.
`;
    
    await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /status:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /today - Get today's lesson
bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const user = await db.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first to begin!');
      return;
    }

    const currentTask = await planService.getCurrentTask(user.start_date);
    
    if (currentTask.completed) {
      await bot.sendMessage(chatId, '🎉 You have completed the program! Bravissimo!');
      return;
    }

    // Generate content based on task focus
    const focus = currentTask.task.focus;
    
    if (focus === 'vocabulary') {
      const words = await wordsService.generateDailyWords(
        currentTask.theme,
        currentTask.task.task,
        focus
      );
      const message = wordsService.formatWordsMessage(words);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else if (focus === 'reading') {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const story = await storyService.generateTaskBasedStory(
        currentTask.theme,
        currentTask.task.task,
        weekVocab
      );
      const message = storyService.formatStoryMessage(story);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else if (['practice', 'writing'].includes(focus)) {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const prompt = await storyService.generatePracticePrompt(currentTask.theme, weekVocab);
      const message = storyService.formatPracticeMessage(prompt);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else if (focus === 'quiz') {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const quiz = await quizService.generateWeeklyQuiz(
        currentTask.weekNumber,
        currentTask.theme,
        weekVocab
      );
      const message = quizService.formatQuizMessage(quiz);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      // General task
      const taskMessage = `
📝 *Today's Task*

*Week ${currentTask.weekNumber} - Day ${currentTask.dayNumber}*
*Theme:* ${currentTask.theme}
*Focus:* ${currentTask.task.focus}

*Task:* ${currentTask.task.task}

_Use /vocab to get vocabulary or chat with me for help!_ 💬
`;
      await bot.sendMessage(chatId, taskMessage, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in /today:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error generating your lesson. Please try again.');
  }
});

// Command: /week - Show week overview
bot.onText(/\/week/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await db.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first!');
      return;
    }

    const currentTask = await planService.getCurrentTask(user.start_date);
    const weekData = await planService.getWeekOverview(currentTask.weekNumber);
    
    let message = `📅 *Week ${weekData.week} Overview*\n\n`;
    message += `*Theme:* ${weekData.theme}\n\n`;
    message += `*Daily Plan:*\n`;
    
    weekData.days.forEach(day => {
      const emoji = day.day === currentTask.dayNumber ? '👉' : '📌';
      message += `\n${emoji} *Day ${day.day}* - ${day.focus}\n`;
      message += `   ${day.task}\n`;
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /week:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /vocab - Get vocabulary
bot.onText(/\/vocab/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const user = await db.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first!');
      return;
    }

    const currentTask = await planService.getCurrentTask(user.start_date);
    
    const words = await wordsService.generateStructuredVocabulary(
      currentTask.theme,
      currentTask.task.task
    );
    
    const message = wordsService.formatStructuredWords(words, currentTask.theme);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    // Save vocabulary
    await db.saveVocabulary(userId, currentTask.weekNumber, words);
  } catch (error) {
    console.error('Error in /vocab:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /quiz - Get a quiz
bot.onText(/\/quiz/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const user = await db.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first!');
      return;
    }

    const currentTask = await planService.getCurrentTask(user.start_date);
    const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
    
    const quiz = await quizService.generateWeeklyQuiz(
      currentTask.weekNumber,
      currentTask.theme,
      weekVocab
    );
    
    const message = quizService.formatQuizMessage(quiz);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /quiz:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
🆘 *Imparo Italiano - Help Guide*

*Scheduled Messages:*
• 08:00 UTC - Morning vocabulary
• 20:00 UTC - Evening story
• 21:00 UTC - Practice exercises
• Sunday 19:00 UTC - Weekly quiz

*Commands:*
/start - Start your Italian journey
/status - View your current progress
/today - Get today's lesson
/week - See this week's plan
/vocab - Get vocabulary for today
/quiz - Take a practice quiz
/help - Show this help message

*Free Conversation:*
Just chat with me in Italian or English anytime!
I'll help with translations, corrections, and explanations.

*Tips:*
✨ Follow the daily schedule for best results
✨ Practice consistently
✨ Don't skip the quizzes
✨ Ask questions anytime

*Having issues?*
Make sure you've started with /start and check your timezone.

Buono studio! (Happy studying!) 📚🇮🇹
`;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Handle regular messages (conversation)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  
  // Ignore if it's a command (already handled)
  if (text && text.startsWith('/')) {
    return;
  }
  
  // Ignore non-text messages
  if (!text) {
    return;
  }
  
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    // Get user context
    const user = await db.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first to begin your journey! 🚀');
      return;
    }

    const currentTask = await planService.getCurrentTask(user.start_date);
    
    // Check if user is submitting practice sentences
    const context = userContext.get(userId) || {};
    if (context.awaitingPractice) {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const feedback = await storyService.checkUserSentences(text, currentTask.theme, weekVocab);
      
      await bot.sendMessage(chatId, `✅ *Feedback on your sentences:*\n\n${feedback}`, { parse_mode: 'Markdown' });
      
      // Save progress
      await db.saveDailyProgress(userId, currentTask.weekNumber, currentTask.dayNumber, {
        sentencesSubmitted: text,
        taskCompleted: true
      });
      
      userContext.delete(userId);
      return;
    }
    
    // General conversation with context about user's progress
    const response = await getChatGPTResponse(userId, text, currentTask);
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(chatId, '❌ Sorry, I encountered an error. Please try again.');
  }
});

/**
 * Get ChatGPT response for general conversation
 */
async function getChatGPTResponse(userId, message, currentTask) {
  try {
    const openai = wordsService.initializeOpenAI();
    
    const systemPrompt = `You are an expert Italian language teacher helping a student in Week ${currentTask.weekNumber} of a 12-week program.

Current theme: "${currentTask.theme}"
Current task: "${currentTask.task.task}"
Day focus: "${currentTask.task.focus}"

Help the student with:
- Answering questions about Italian
- Correcting mistakes gently
- Providing translations
- Explaining grammar
- Encouraging their progress

Be supportive, clear, and educational. Always relate answers to their current learning stage.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT Error:', error);
    throw error;
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  scheduler.stopScheduler();
  await db.closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  scheduler.stopScheduler();
  await db.closeDatabase();
  process.exit(0);
});

// Initialize and start the bot
initialize();

