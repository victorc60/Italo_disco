import OpenAI from 'openai';

/**
 * Service for generating Italian vocabulary using OpenAI
 * Generates words based on weekly themes from plan.json
 */

let openai = null;

/**
 * Initialize OpenAI client
 */
export function initializeOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY?.trim(),
    });
  }
  return openai;
}

/**
 * Generate daily vocabulary words based on theme and task
 * @param {string} theme - Weekly theme (e.g., "Greetings and Basic Phrases")
 * @param {string} task - Daily task description
 * @param {string} focus - Day focus (vocabulary, grammar, practice, etc.)
 * @param {number} count - Number of words to generate (default: 5)
 * @returns {Promise<Object>} Generated words with translations and examples
 */
export async function generateDailyWords(theme, task, focus, count = 5) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const prompt = `You are an expert Italian language teacher. Generate ${count} Italian words/phrases for learners.

Theme: "${theme}"
Task: "${task}"
Focus: "${focus}"

For each word/phrase, provide:
1. Italian word/phrase
2. English translation
3. Example sentence in Italian with English translation
4. Pronunciation tip (optional)

Format your response as a structured list that's easy to read and learn from. Make it engaging and educational. Include only the most useful and practical words for this theme.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an enthusiastic Italian language teacher who makes learning fun and practical. Always provide clear examples and helpful tips.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content;

    return {
      theme,
      task,
      focus,
      content: response,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating words:', error);
    throw error;
  }
}

/**
 * Generate vocabulary specifically for vocabulary-focused days
 * Returns structured format suitable for database storage
 * @param {string} theme - Weekly theme
 * @param {string} task - Daily task
 * @returns {Promise<Array>} Array of word objects
 */
export async function generateStructuredVocabulary(theme, task) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const prompt = `Generate exactly 25 Italian vocabulary words for the theme: "${theme}".
Task: "${task}"

Return ONLY a valid JSON array with this exact structure:
[
  {
    "italian": "ciao",
    "english": "hello",
    "example": "Ciao! Come stai?",
    "exampleTranslation": "Hello! How are you?"
  }
]

Important: Return ONLY the JSON array, no additional text or markdown.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a vocabulary generator. Return ONLY valid JSON arrays, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content.trim();
    
    // Try to extract JSON if wrapped in markdown
    let jsonText = response;
    if (response.includes('```json')) {
      jsonText = response.split('```json')[1].split('```')[0].trim();
    } else if (response.includes('```')) {
      jsonText = response.split('```')[1].split('```')[0].trim();
    }

    const words = JSON.parse(jsonText);
    return words;
  } catch (error) {
    console.error('Error generating structured vocabulary:', error);
    // Return fallback data
    return generateFallbackVocabulary(theme);
  }
}

/**
 * Fallback vocabulary if API fails
 */
function generateFallbackVocabulary(theme) {
  return [
    {
      italian: 'ciao',
      english: 'hello/goodbye',
      example: 'Ciao! Come stai?',
      exampleTranslation: 'Hello! How are you?'
    },
    {
      italian: 'grazie',
      english: 'thank you',
      example: 'Grazie mille!',
      exampleTranslation: 'Thank you very much!'
    },
    {
      italian: 'per favore',
      english: 'please',
      example: 'Un caffè, per favore.',
      exampleTranslation: 'A coffee, please.'
    },
    {
      italian: 'scusa',
      english: 'excuse me/sorry',
      example: 'Scusa, dov\'è la stazione?',
      exampleTranslation: 'Excuse me, where is the station?'
    },
    {
      italian: 'buongiorno',
      english: 'good morning',
      example: 'Buongiorno! Come va?',
      exampleTranslation: 'Good morning! How are you?'
    }
  ];
}

/**
 * Format words for Telegram message
 * @param {Object} wordsData - Words data from generateDailyWords
 * @param {string} emoji - Emoji to use in header
 * @returns {string} Formatted message
 */
export function formatWordsMessage(wordsData, emoji = '📚') {
  return `${emoji} *Italian Words - Day ${wordsData.focus}*

*Theme:* ${wordsData.theme}
*Today's Task:* ${wordsData.task}

${wordsData.content}

_Keep learning! Practice these words today._ ✨`;
}

/**
 * Format structured vocabulary for Telegram
 * @param {Array} words - Array of word objects
 * @param {string} theme - Theme name
 * @returns {string} Formatted message
 */
export function formatStructuredWords(words, theme) {
  let message = `📚 *Daily Vocabulary - ${theme}*\n\n`;
  
  words.slice(0, 5).forEach((word, index) => {
    message += `*${index + 1}. ${word.italian}*\n`;
    message += `   🇬🇧 ${word.english}\n`;
    message += `   💬 _"${word.example}"_\n`;
    message += `   📝 ${word.exampleTranslation}\n\n`;
  });

  message += `_💡 Practice using these words in your own sentences today!_`;
  
  return message;
}

export default {
  initializeOpenAI,
  generateDailyWords,
  generateStructuredVocabulary,
  formatWordsMessage,
  formatStructuredWords
};

