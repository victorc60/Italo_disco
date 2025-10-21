import OpenAI from 'openai';

/**
 * Words Service - Handles vocabulary generation and management
 * Uses OpenAI to generate Italian vocabulary based on themes and daily tasks
 */

let openai = null;

/**
 * Initialize OpenAI client
 */
export function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  console.log('✅ OpenAI initialized for words service');
  return openai;
}

/**
 * Generate daily words based on theme and task
 * @param {string} theme - Week theme
 * @param {string} task - Daily task description
 * @param {string} focus - Daily focus (vocabulary, grammar, etc.)
 * @returns {Array} Array of word objects
 */
export async function generateDailyWords(theme, task, focus) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const systemPrompt = `You are an expert Italian language teacher. Generate 20 Italian words related to the theme "${theme}" for a daily vocabulary lesson.

Requirements:
- Generate exactly 20 words
- Include common, useful words that beginners can learn
- Each word should have: Italian word, English translation, phonetic pronunciation, and a simple example sentence
- Focus on practical vocabulary that relates to the theme
- Make sure words are appropriate for beginners to intermediate learners

Format your response as a JSON array with this structure:
[
  {
    "italian": "word in Italian",
    "english": "English translation",
    "pronunciation": "phonetic pronunciation",
    "example": "example sentence in Italian",
    "translation": "English translation of example"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate vocabulary for theme: ${theme}, task: ${task}, focus: ${focus}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const words = JSON.parse(response);
    
    console.log(`✅ Generated ${words.length} words for theme: ${theme}`);
    return words;
    
  } catch (error) {
    console.error('Error generating daily words:', error);
    
    // Fallback vocabulary if OpenAI fails
    return getFallbackVocabulary(theme);
  }
}

/**
 * Generate structured vocabulary for a theme
 * @param {string} theme - Week theme
 * @param {string} task - Daily task description
 * @returns {Array} Array of structured vocabulary objects
 */
export async function generateStructuredVocabulary(theme, task) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const systemPrompt = `You are an expert Italian language teacher. Generate a comprehensive vocabulary list for the theme "${theme}".

Requirements:
- Generate 25-30 words organized by categories
- Include: nouns, verbs, adjectives, and useful phrases
- Each word should have: Italian word, English translation, phonetic pronunciation, and example sentence
- Organize words logically by category
- Include common expressions and phrases related to the theme

Format your response as a JSON array with this structure:
[
  {
    "category": "category name (e.g., 'Nouns', 'Verbs', 'Adjectives', 'Phrases')",
    "words": [
      {
        "italian": "word in Italian",
        "english": "English translation",
        "pronunciation": "phonetic pronunciation",
        "example": "example sentence in Italian",
        "translation": "English translation of example"
      }
    ]
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate structured vocabulary for theme: ${theme}, task: ${task}` }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const structuredVocab = JSON.parse(response);
    
    console.log(`✅ Generated structured vocabulary for theme: ${theme}`);
    return structuredVocab;
    
  } catch (error) {
    console.error('Error generating structured vocabulary:', error);
    
    // Fallback structured vocabulary
    return getFallbackStructuredVocabulary(theme);
  }
}

/**
 * Format words message for Telegram
 * @param {Array} words - Array of word objects
 * @returns {string} Formatted message
 */
export function formatWordsMessage(words) {
  let message = `📚 *Daily Vocabulary* 📚\n\n`;
  
  words.forEach((word, index) => {
    message += `*${index + 1}. ${word.italian}* - ${word.english}\n`;
    message += `🔊 ${word.pronunciation}\n`;
    message += `📝 *Example:* ${word.example}\n`;
    message += `   _${word.translation}_\n\n`;
  });
  
  message += `\n*Buono studio!* (Happy studying!) 📖✨\n`;
  message += `\n_Tip: Practice pronouncing each word out loud!_ 🗣️`;
  
  return message;
}

/**
 * Format structured words message for Telegram
 * @param {Array} structuredVocab - Array of structured vocabulary objects
 * @param {string} theme - Week theme
 * @returns {string} Formatted message
 */
export function formatStructuredWords(structuredVocab, theme) {
  let message = `📚 *Structured Vocabulary - ${theme}* 📚\n\n`;
  
  structuredVocab.forEach(category => {
    message += `*${category.category.toUpperCase()}*\n`;
    
    category.words.forEach(word => {
      message += `• *${word.italian}* - ${word.english}\n`;
      message += `  🔊 ${word.pronunciation}\n`;
      message += `  📝 ${word.example}\n`;
      message += `     _${word.translation}_\n\n`;
    });
    
    message += `\n`;
  });
  
  message += `\n*Buono studio!* (Happy studying!) 📖✨\n`;
  message += `\n_Tip: Practice using these words in your own sentences!_ 🗣️`;
  
  return message;
}

/**
 * Get fallback vocabulary when OpenAI fails
 * @param {string} theme - Week theme
 * @returns {Array} Array of fallback words
 */
function getFallbackVocabulary(theme) {
  const fallbackWords = {
    'Greetings and Basic Phrases': [
      {
        italian: 'Ciao',
        english: 'Hello/Goodbye',
        pronunciation: 'chow',
        example: 'Ciao, come stai?',
        translation: 'Hello, how are you?'
      },
      {
        italian: 'Buongiorno',
        english: 'Good morning',
        pronunciation: 'bwon-jor-no',
        example: 'Buongiorno, signore!',
        translation: 'Good morning, sir!'
      },
      {
        italian: 'Grazie',
        english: 'Thank you',
        pronunciation: 'grahts-yeh',
        example: 'Grazie mille!',
        translation: 'Thank you very much!'
      }
    ],
    'Numbers and Dates': [
      {
        italian: 'Uno',
        english: 'One',
        pronunciation: 'oo-no',
        example: 'Ho un gatto.',
        translation: 'I have one cat.'
      },
      {
        italian: 'Due',
        english: 'Two',
        pronunciation: 'doo-eh',
        example: 'Sono le due.',
        translation: 'It\'s two o\'clock.'
      }
    ]
  };
  
  return fallbackWords[theme] || fallbackWords['Greetings and Basic Phrases'];
}

/**
 * Get fallback structured vocabulary when OpenAI fails
 * @param {string} theme - Week theme
 * @returns {Array} Array of fallback structured vocabulary
 */
function getFallbackStructuredVocabulary(theme) {
  return [
    {
      category: 'Nouns',
      words: getFallbackVocabulary(theme).slice(0, 5)
    },
    {
      category: 'Verbs',
      words: getFallbackVocabulary(theme).slice(5, 10)
    },
    {
      category: 'Adjectives',
      words: getFallbackVocabulary(theme).slice(10, 15)
    }
  ];
}
