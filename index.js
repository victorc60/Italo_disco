import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import * as db from './services/db.js';
import * as planService from './services/planService.js';
import * as wordsService from './services/wordsService.js';
import * as storyService from './services/storyService.js';
import * as quizService from './services/quizService.js';
import * as scheduler from './services/scheduler.js';
import * as reviewService from './services/reviewService.js';

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
    // Check if user already exists
    let user = await db.getUser(userId);
    const isNewUser = !user;
    
    // Register only if new user
    if (!user) {
      user = await db.registerUser(userId, username, firstName);
    }
    
    // Get current progress
    const currentTask = await planService.getCurrentTask(user.start_date);
    
    const welcomeMessage = isNewUser ? `
🇮🇹 *Benvenuto! Welcome to Imparo Italiano!* 🇮🇹

${firstName}, I'm your AI-powered Italian learning assistant with a structured 12-week curriculum!

📚 *How it works:*
• *08:00 UTC* - Daily learning task (vocabulary, grammar, reading, etc.)
• *20:00 UTC* - Evening reminder and practice
• *Sunday 19:00 UTC* - Weekly quiz

📖 *12-Week Curriculum:*
Week 1: Greetings and Basic Phrases
Week 2: Numbers and Dates
Week 3: Family and Relationships
Week 4: Daily Routine
...and much more!

*Available Commands:*
/start - Start your Italian journey
/status - View your current progress
/today - Get today's lesson
/week - See this week's plan
/vocab - Get vocabulary for today (8-10 words, story-based)
/review - Review previous vocabulary (spaced repetition)
/reviewquiz - Take interactive review quiz
/quiz - Take a practice quiz
/setday <days> - Set start date (e.g., /setday 1 = started yesterday)
/help - Show this help message

*Ready to start your Italian journey?*
Type /today to begin! 🚀

_Note: Daily tasks are sent every morning at 8:00 UTC. You can also request content anytime using commands!_
` : `
🇮🇹 *Welcome back, ${firstName}!* 🇮🇹

You're currently on *Week ${currentTask.weekNumber}, Day ${currentTask.dayNumber}* of your Italian journey!

📚 *How it works:*
• *08:00 UTC* - Daily learning task (vocabulary, grammar, reading, etc.)
• *20:00 UTC* - Evening reminder and practice
• *Sunday 19:00 UTC* - Weekly quiz

*Available Commands:*
/start - Start your Italian journey
/status - View your current progress
/today - Get today's lesson
/week - See this week's plan
/vocab - Get vocabulary for today (8-10 words, story-based)
/review - Review previous vocabulary (spaced repetition)
/reviewquiz - Take interactive review quiz
/quiz - Take a practice quiz
/setday <days> - Set start date (e.g., /setday 1 = started yesterday)
/help - Show this help message

*Ready to continue your Italian journey?*
Type /today to see today's lesson! 🚀

_Your learning journey started on ${new Date(user.start_date).toDateString()}_`;
    
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
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );
    
    // Get review statistics
    const reviewStats = await reviewService.getReviewStats(userId);
    
    const statusMessage = `
📊 *Your Learning Progress*

*Week ${currentTask.weekNumber} of 12* - ${dailyPlan.theme}
*Day ${currentTask.dayNumber} of 7*
*Total Days:* ${currentTask.totalDays}

*Today's Focus:* ${dailyPlan.focus}
${dailyPlan.vocabularyCount > 0 ? `*New Words Today:* ${dailyPlan.vocabularyCount} words\n` : ''}
*Estimated Time:* ${dailyPlan.estimatedTime}

*This Week:*
📖 Vocabulary learned: ${weekVocab.length} words
🔄 Words reviewed: ${reviewStats.totalWordsReviewed} words
🎯 Theme: ${dailyPlan.theme}

*Review Progress:*
✅ Mastered words: ${reviewStats.masteredWords}
📚 Words to review: ${reviewStats.wordsToReview}

*Keep going!* 💪
Type /today to get today's lesson, /review for vocabulary review, or /week to see the full week plan.
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

    // Generate daily plan
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );

    // Check if this day includes review (Days 2-7)
    if (dailyPlan.includesReview && currentTask.dayNumber > 1) {
      // Send review first
      const reviewWords = await reviewService.getWordsForReview(
        userId,
        currentTask.weekNumber,
        user.start_date
      );
      
      if (reviewWords.length > 0) {
        const reviewQuiz = reviewService.generateReviewQuiz(reviewWords);
        if (reviewQuiz) {
          let reviewMessage = `🔄 *Daily Review* (Spaced Repetition)\n\n`;
          reviewMessage += `Reviewing ${reviewQuiz.wordsCount} words from previous days:\n\n`;
          reviewMessage += `*Instructions:* ${reviewQuiz.instructions}\n\n`;
          
          reviewMessage += `Take your time! Try to recall each word before checking. 💪\n\n`;
          reviewMessage += `Type /reviewquiz to take the interactive review quiz!`;
          
          await bot.sendMessage(chatId, reviewMessage, { parse_mode: 'Markdown' });
        }
      }
      
      // Small delay before main content
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Generate content based on task focus
    const focus = dailyPlan.focus;
    const wordCount = dailyPlan.vocabularyCount || 10;
    
    if (focus === 'introduction' || focus === 'integration' || focus === 'expansion') {
      // New vocabulary + grammar integrated learning
      const vocabData = await wordsService.generateDailyWords(
        dailyPlan.theme,
        dailyPlan.task,
        focus,
        wordCount
      );
      
      let message = `🌅 *Morning Learning Session*\n\n`;
      message += wordsService.formatWordsMessage(vocabData);
      
      // Add grammar integration message
      message += `\n\n📝 *Grammar Integration:*\n`;
      message += `Today you'll learn grammar rules that use these words!\n`;
      message += `Everything connects together - vocabulary + grammar + context.\n\n`;
      message += `Type /grammar to see today's grammar lesson!`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      // Save vocabulary (extract words array for storage)
      const wordsArray = wordsService.extractWords(vocabData);
      await db.saveVocabulary(userId, currentTask.weekNumber, wordsArray);
    } else if (focus === 'practice') {
      // Review + listening practice
      const reviewWords = await reviewService.getWordsForReview(
        userId,
        currentTask.weekNumber,
        user.start_date
      );
      
      let message = `🎧 *Practice Session*\n\n`;
      message += `📚 *Review:* ${reviewWords.length} words from this week\n`;
      message += `🎧 *Listening:* Practice understanding spoken Italian\n`;
      message += `🗣️ *Speaking:* Practice pronunciation\n\n`;
      message += `Use /vocab to review vocabulary, or /quiz for listening exercises!`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
    } else if (focus === 'reading') {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const story = await storyService.generateTaskBasedStory(
        dailyPlan.theme,
        dailyPlan.task,
        weekVocab
      );
      const message = storyService.formatStoryMessage(story);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else if (['practice', 'writing'].includes(focus)) {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const prompt = await storyService.generatePracticePrompt(dailyPlan.theme, weekVocab);
      const message = storyService.formatPracticeMessage(prompt);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else if (focus === 'quiz') {
      const weekVocab = await db.getWeekVocabulary(userId, currentTask.weekNumber);
      const quiz = await quizService.generateWeeklyQuiz(
        currentTask.weekNumber,
        dailyPlan.theme,
        weekVocab
      );
      const message = quizService.formatQuizMessage(quiz);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      // Other focuses - show the daily plan with improved structure
      const taskMessage = `
📝 *Today's Learning Plan*

*Week ${dailyPlan.weekNumber}, Day ${dailyPlan.dayNumber}*
*Theme:* ${dailyPlan.theme}

📚 *Today's Focus:* ${dailyPlan.focus}
⏱️ *Estimated Time:* ${dailyPlan.estimatedTime}
${dailyPlan.vocabularyCount > 0 ? `📖 *New Words:* ${dailyPlan.vocabularyCount} words\n` : ''}
${dailyPlan.includesReview ? '🔄 *Includes Review:* Yes (spaced repetition)\n' : ''}

*Your Task:*
${dailyPlan.description}

*Today's Structure:*
${dailyPlan.morning ? `🌅 Morning: ${dailyPlan.morning.replace('_', ' ')}\n` : ''}
${dailyPlan.afternoon ? `🌆 Afternoon: ${dailyPlan.afternoon.replace('_', ' ')}\n` : ''}
${dailyPlan.evening ? `🌙 Evening: ${dailyPlan.evening.replace('_', ' ')}\n` : ''}

*Exercises:*
${dailyPlan.exercises.map(ex => `• ${ex.description}`).join('\n')}

*Commands:*
${dailyPlan.vocabularyCount > 0 ? '/vocab - Get today\'s vocabulary\n' : ''}
${dailyPlan.includesReview ? '/review - Review previous words\n' : ''}
/quiz - Practice quiz
/week - See this week's plan

*Buono studio!* (Happy studying!) 📖✨

_Everything is connected - vocabulary, grammar, and context work together!_ 💪
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
      message += `   ⏱️ ${day.estimatedTime}\n`;
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
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );
    
    // Use new story-based vocabulary generation
    const wordCount = dailyPlan.vocabularyCount || 10;
    const vocabData = await wordsService.generateDailyWords(
      dailyPlan.theme,
      dailyPlan.task,
      dailyPlan.focus,
      wordCount
    );
    
    const message = wordsService.formatWordsMessage(vocabData);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    // Save vocabulary
    const wordsArray = wordsService.extractWords(vocabData);
    await db.saveVocabulary(userId, currentTask.weekNumber, wordsArray);
  } catch (error) {
    console.error('Error in /vocab:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /review - Review previous vocabulary
bot.onText(/\/review/, async (msg) => {
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
    
    const reviewWords = await reviewService.getWordsForReview(
      userId,
      currentTask.weekNumber,
      user.start_date
    );
    
    if (reviewWords.length === 0) {
      await bot.sendMessage(chatId, `✅ No words to review right now! Keep learning new words and they'll appear here for review.`, { parse_mode: 'Markdown' });
      return;
    }
    
    const reviewQuiz = reviewService.generateReviewQuiz(reviewWords);
    
    if (reviewQuiz) {
      let message = `🔄 *Daily Review* (Spaced Repetition) 🔄\n\n`;
      message += `*Words to Review:* ${reviewQuiz.wordsCount}\n\n`;
      message += `*Instructions:*\n${reviewQuiz.instructions}\n\n`;
      message += `Type /reviewquiz to take the interactive review quiz!\n\n`;
      message += `Or type /reviewwords to see all words that need review.`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in /review:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /reviewquiz - Take review quiz
bot.onText(/\/reviewquiz/, async (msg) => {
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
    
    const reviewWords = await reviewService.getWordsForReview(
      userId,
      currentTask.weekNumber,
      user.start_date
    );
    
    if (reviewWords.length === 0) {
      await bot.sendMessage(chatId, `✅ No words to review right now!`, { parse_mode: 'Markdown' });
      return;
    }
    
    const reviewQuiz = reviewService.generateReviewQuiz(reviewWords);
    
    if (reviewQuiz) {
      let message = `📚 *Review Quiz* 📚\n\n`;
      
      reviewQuiz.questions.forEach((q, index) => {
        message += `*Question ${index + 1}:*\n`;
        message += `${q.question}\n\n`;
        message += `*Answer:* ${q.correctAnswer}\n`;
        message += `${q.explanation}\n\n`;
        message += `─\n\n`;
      });
      
      message += `*Great job on your review!* 💪\n`;
      message += `Keep practicing these words - spaced repetition helps you remember long-term!`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in /reviewquiz:', error);
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
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );
    
    const quiz = await quizService.generateWeeklyQuiz(
      currentTask.weekNumber,
      dailyPlan.theme,
      weekVocab
    );
    
    const message = quizService.formatQuizMessage(quiz);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /quiz:', error);
    await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /setday - Manually set your start day (for testing)
bot.onText(/\/setday (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const daysAgo = parseInt(match[1]);

  try {
    const user = await db.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Please use /start first!');
      return;
    }

    // Set start date to X days ago
    const newStartDate = new Date();
    newStartDate.setDate(newStartDate.getDate() - daysAgo);

    // Update user's start date
    await db.updateUserStartDate(userId, newStartDate);
    
    // Calculate new progress
    const progress = planService.calculateProgress(newStartDate);
    const currentTask = await planService.getCurrentTask(newStartDate);
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );

    await bot.sendMessage(chatId, `✅ *Start date adjusted!*

Start date set to: ${newStartDate.toDateString()} (${daysAgo} days ago)

*Current Progress:*
Week ${progress.weekNumber}, Day ${progress.dayNumber}
Theme: ${currentTask.theme}
Today's Focus: ${dailyPlan.focus}
Task: ${dailyPlan.task}

Type /today to get your current lesson!`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /setday:', error);
    await bot.sendMessage(chatId, '❌ Error setting start date.');
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
/setday <days> - Set start date (e.g., /setday 1 = started yesterday)
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
      const dailyPlan = await planService.generateDailyPlan(
        currentTask.weekNumber, 
        currentTask.dayNumber
      );
      const feedback = await storyService.checkUserSentences(text, dailyPlan.theme, weekVocab);
      
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
    const dailyPlan = await planService.generateDailyPlan(
      currentTask.weekNumber, 
      currentTask.dayNumber
    );
    
    const systemPrompt = `Italian teacher. Week ${currentTask.weekNumber}/12. Theme: "${currentTask.theme}". Task: "${dailyPlan.task}". Focus: "${dailyPlan.focus}". Help with questions, corrections, translations, grammar. Be supportive, clear, educational.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.substring(0, 1000) }
      ],
      temperature: 0.7,
      max_tokens: 800,
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

