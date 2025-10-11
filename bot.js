require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation history for each user
const userConversations = new Map();

// System prompt for Italian learning assistant
const SYSTEM_PROMPT = `You are an expert Italian language teacher and conversation partner. Your role is to:
1. Help users learn Italian through natural conversation
2. Correct mistakes gently and explain grammar rules
3. Provide translations between English and Italian
4. Teach vocabulary, idioms, and cultural context
5. Adapt to the user's level (beginner, intermediate, advanced)
6. Be encouraging and supportive
7. Use Italian as much as possible, but provide English explanations when needed

When the user makes a mistake, correct it kindly and explain why. Always be patient and enthusiastic about their progress.`;

// Get or create conversation history for a user
function getConversationHistory(userId) {
  if (!userConversations.has(userId)) {
    userConversations.set(userId, [
      { role: 'system', content: SYSTEM_PROMPT }
    ]);
  }
  return userConversations.get(userId);
}

// Add message to conversation history (keep last 20 messages to manage token usage)
function addToHistory(userId, role, content) {
  const history = getConversationHistory(userId);
  history.push({ role, content });
  
  // Keep system message + last 20 messages
  if (history.length > 21) {
    userConversations.set(userId, [
      history[0], // Keep system message
      ...history.slice(-20) // Keep last 20 messages
    ]);
  }
}

// Clear conversation history
function clearHistory(userId) {
  userConversations.delete(userId);
}

// Get ChatGPT response
async function getChatGPTResponse(userId, message) {
  try {
    const history = getConversationHistory(userId);
    addToHistory(userId, 'user', message);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: history,
      temperature: 0.6,
      max_tokens: 1000,
    });
    
    const response = completion.choices[0].message.content;
    addToHistory(userId, 'assistant', response);
    
    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Command: /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🇮🇹 *Benvenuto! Welcome to Imparo Italiano Bot!* 🇮🇹

I'm your AI-powered Italian learning assistant. I can help you:

📚 *Learn Italian through conversation*
🗣️ *Practice speaking and writing*
📖 *Translate words and phrases*
✍️ *Correct your mistakes*
📝 *Explain grammar rules*
🎯 *Build vocabulary*

*Available Commands:*
/start - Show this welcome message
/help - Get help and tips
/translate - Quick translation mode
/grammar - Ask about grammar rules
/vocab - Learn new vocabulary
/clear - Start a new conversation

*How to use:*
Just start chatting with me in Italian or English! I'll help you learn naturally.

Try saying: "Ciao! Come stai?" or "How do I say 'thank you' in Italian?"
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Command: /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🆘 *How to use this bot:*

*1. Free Conversation*
Just chat with me! Write in Italian or English, and I'll respond naturally.

*2. Ask for Translations*
"How do you say 'good morning' in Italian?"
"Translate: I love learning languages"

*3. Grammar Questions*
"When do I use 'essere' vs 'stare'?"
"Explain Italian past tense"

*4. Vocabulary Building*
"Teach me food vocabulary"
"What are common Italian phrases?"

*5. Practice Writing*
Write sentences in Italian and I'll correct them!

*6. Cultural Context*
Ask about Italian culture, customs, and expressions

*Tips:*
✨ Don't be afraid to make mistakes - that's how you learn!
✨ Try to write in Italian as much as possible
✨ Ask me to explain anything you don't understand
✨ Use /clear to reset our conversation if you want a fresh start

Forza! Let's learn Italian together! 🚀
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Command: /translate
bot.onText(/\/translate(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1].trim();
  
  if (!text) {
    bot.sendMessage(chatId, 'Please provide text to translate.\n\nExample: /translate Hello, how are you?');
    return;
  }
  
  try {
    bot.sendChatAction(chatId, 'typing');
    const prompt = `Translate the following text between English and Italian. If it's English, translate to Italian. If it's Italian, translate to English. Provide the translation and a brief explanation if needed:\n\n"${text}"`;
    const response = await getChatGPTResponse(userId, prompt);
    bot.sendMessage(chatId, response);
  } catch (error) {
    bot.sendMessage(chatId, '❌ Sorry, there was an error processing your request. Please try again.');
  }
});

// Command: /grammar
bot.onText(/\/grammar(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const question = match[1].trim();
  
  if (!question) {
    bot.sendMessage(chatId, 'Ask me any grammar question!\n\nExample: /grammar When do I use the subjunctive mood?');
    return;
  }
  
  try {
    bot.sendChatAction(chatId, 'typing');
    const prompt = `Grammar question: ${question}\n\nPlease explain this Italian grammar concept clearly with examples.`;
    const response = await getChatGPTResponse(userId, prompt);
    bot.sendMessage(chatId, response);
  } catch (error) {
    bot.sendMessage(chatId, '❌ Sorry, there was an error processing your request. Please try again.');
  }
});

// Command: /vocab
bot.onText(/\/vocab(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const topic = match[1].trim();
  
  try {
    bot.sendChatAction(chatId, 'typing');
    const prompt = topic 
      ? `Teach me Italian vocabulary related to: ${topic}. Provide 8-10 useful words/phrases with English translations and example sentences.`
      : `Teach me 10 useful Italian words or phrases that beginners should know. Include translations and example sentences.`;
    const response = await getChatGPTResponse(userId, prompt);
    bot.sendMessage(chatId, response);
  } catch (error) {
    bot.sendMessage(chatId, '❌ Sorry, there was an error processing your request. Please try again.');
  }
});

// Command: /clear
bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  clearHistory(userId);
  bot.sendMessage(chatId, '✅ Conversation cleared! Let\'s start fresh. Come posso aiutarti? (How can I help you?)');
});

// Handle all other messages (regular conversation)
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
    bot.sendChatAction(chatId, 'typing');
    const response = await getChatGPTResponse(userId, text);
    bot.sendMessage(chatId, response);
  } catch (error) {
    console.error('Error:', error);
    bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again or use /clear to reset.');
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Imparo Italiano Bot is running...');
console.log('Bot is ready to help users learn Italian! 🇮🇹');

