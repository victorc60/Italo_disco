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
    
    const systemPrompt = `You are an expert Italian language teacher. Generate exactly 20 Italian words related to the theme "${theme}" for a daily vocabulary lesson.

CRITICAL REQUIREMENTS:
- Generate EXACTLY 20 words - no more, no less
- Include common, useful words that beginners can learn
- Each word should have: Italian word, English translation, phonetic pronunciation, and a simple example sentence
- Focus on practical vocabulary that relates to the theme
- Make sure words are appropriate for beginners to intermediate learners
- Do not include any explanations or additional text, only the JSON array

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
        { role: 'user', content: `Generate exactly 20 vocabulary words for theme: ${theme}, task: ${task}, focus: ${focus}` }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const words = JSON.parse(response);
    
    // Validate that we got exactly 20 words
    if (words.length !== 20) {
      console.log(`⚠️ OpenAI returned ${words.length} words instead of 20. Using fallback vocabulary.`);
      return getFallbackVocabulary(theme);
    }
    
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
- Generate at least 20 words organized by categories
- Include: nouns, verbs, adjectives, and useful phrases
- Each word should have: Italian word, English translation, phonetic pronunciation, and example sentence
- Organize words logically by category
- Include common expressions and phrases related to the theme
- Make sure total words across all categories equals at least 20

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
        italian: 'Buonasera',
        english: 'Good evening',
        pronunciation: 'bwon-ah-seh-rah',
        example: 'Buonasera, signora!',
        translation: 'Good evening, madam!'
      },
      {
        italian: 'Arrivederci',
        english: 'Goodbye',
        pronunciation: 'ah-ree-veh-der-chee',
        example: 'Arrivederci, a domani!',
        translation: 'Goodbye, see you tomorrow!'
      },
      {
        italian: 'Grazie',
        english: 'Thank you',
        pronunciation: 'grahts-yeh',
        example: 'Grazie mille!',
        translation: 'Thank you very much!'
      },
      {
        italian: 'Prego',
        english: 'You\'re welcome',
        pronunciation: 'preh-go',
        example: 'Prego, di niente!',
        translation: 'You\'re welcome, it\'s nothing!'
      },
      {
        italian: 'Scusi',
        english: 'Excuse me',
        pronunciation: 'skoo-zee',
        example: 'Scusi, dove è il bagno?',
        translation: 'Excuse me, where is the bathroom?'
      },
      {
        italian: 'Mi dispiace',
        english: 'I\'m sorry',
        pronunciation: 'mee dees-pee-ah-cheh',
        example: 'Mi dispiace, non capisco.',
        translation: 'I\'m sorry, I don\'t understand.'
      },
      {
        italian: 'Per favore',
        english: 'Please',
        pronunciation: 'per fah-vo-reh',
        example: 'Per favore, aiutatemi.',
        translation: 'Please, help me.'
      },
      {
        italian: 'Sì',
        english: 'Yes',
        pronunciation: 'see',
        example: 'Sì, grazie!',
        translation: 'Yes, thank you!'
      },
      {
        italian: 'No',
        english: 'No',
        pronunciation: 'noh',
        example: 'No, non voglio.',
        translation: 'No, I don\'t want to.'
      },
      {
        italian: 'Come stai?',
        english: 'How are you?',
        pronunciation: 'koh-meh stah-ee',
        example: 'Ciao! Come stai oggi?',
        translation: 'Hello! How are you today?'
      },
      {
        italian: 'Bene',
        english: 'Good/Well',
        pronunciation: 'beh-neh',
        example: 'Sto bene, grazie!',
        translation: 'I\'m well, thank you!'
      },
      {
        italian: 'Male',
        english: 'Bad',
        pronunciation: 'mah-leh',
        example: 'Oggi sto male.',
        translation: 'Today I feel bad.'
      },
      {
        italian: 'Così così',
        english: 'So-so',
        pronunciation: 'koh-see koh-see',
        example: 'Come stai? Così così.',
        translation: 'How are you? So-so.'
      },
      {
        italian: 'Piacere',
        english: 'Nice to meet you',
        pronunciation: 'pee-ah-cheh-reh',
        example: 'Piacere di conoscerti!',
        translation: 'Nice to meet you!'
      },
      {
        italian: 'A presto',
        english: 'See you soon',
        pronunciation: 'ah pres-toh',
        example: 'A presto, ciao!',
        translation: 'See you soon, goodbye!'
      },
      {
        italian: 'Buona giornata',
        english: 'Have a good day',
        pronunciation: 'bwon-ah jor-nah-tah',
        example: 'Buona giornata a tutti!',
        translation: 'Have a good day everyone!'
      },
      {
        italian: 'Buona notte',
        english: 'Good night',
        pronunciation: 'bwon-ah noht-teh',
        example: 'Buona notte, dormi bene!',
        translation: 'Good night, sleep well!'
      },
      {
        italian: 'A domani',
        english: 'See you tomorrow',
        pronunciation: 'ah doh-mah-nee',
        example: 'A domani, arrivederci!',
        translation: 'See you tomorrow, goodbye!'
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
      },
      {
        italian: 'Tre',
        english: 'Three',
        pronunciation: 'treh',
        example: 'Ho tre figli.',
        translation: 'I have three children.'
      },
      {
        italian: 'Quattro',
        english: 'Four',
        pronunciation: 'kwah-troh',
        example: 'Sono le quattro.',
        translation: 'It\'s four o\'clock.'
      },
      {
        italian: 'Cinque',
        english: 'Five',
        pronunciation: 'cheen-kweh',
        example: 'Ho cinque anni.',
        translation: 'I am five years old.'
      },
      {
        italian: 'Sei',
        english: 'Six',
        pronunciation: 'say',
        example: 'Sono le sei.',
        translation: 'It\'s six o\'clock.'
      },
      {
        italian: 'Sette',
        english: 'Seven',
        pronunciation: 'set-teh',
        example: 'Ho sette giorni.',
        translation: 'I have seven days.'
      },
      {
        italian: 'Otto',
        english: 'Eight',
        pronunciation: 'oht-toh',
        example: 'Sono le otto.',
        translation: 'It\'s eight o\'clock.'
      },
      {
        italian: 'Nove',
        english: 'Nine',
        pronunciation: 'noh-veh',
        example: 'Ho nove libri.',
        translation: 'I have nine books.'
      },
      {
        italian: 'Dieci',
        english: 'Ten',
        pronunciation: 'dee-eh-chee',
        example: 'Sono le dieci.',
        translation: 'It\'s ten o\'clock.'
      },
      {
        italian: 'Venti',
        english: 'Twenty',
        pronunciation: 'ven-tee',
        example: 'Ho venti anni.',
        translation: 'I am twenty years old.'
      },
      {
        italian: 'Trenta',
        english: 'Thirty',
        pronunciation: 'tren-tah',
        example: 'Sono le trenta.',
        translation: 'It\'s thirty o\'clock.'
      },
      {
        italian: 'Cento',
        english: 'One hundred',
        pronunciation: 'chen-toh',
        example: 'Ho cento euro.',
        translation: 'I have one hundred euros.'
      },
      {
        italian: 'Oggi',
        english: 'Today',
        pronunciation: 'ohj-jee',
        example: 'Oggi è lunedì.',
        translation: 'Today is Monday.'
      },
      {
        italian: 'Ieri',
        english: 'Yesterday',
        pronunciation: 'yeh-ree',
        example: 'Ieri ho visto un film.',
        translation: 'Yesterday I watched a movie.'
      },
      {
        italian: 'Domani',
        english: 'Tomorrow',
        pronunciation: 'doh-mah-nee',
        example: 'Domani vado al cinema.',
        translation: 'Tomorrow I\'m going to the cinema.'
      },
      {
        italian: 'Lunedì',
        english: 'Monday',
        pronunciation: 'loo-neh-dee',
        example: 'Lunedì inizio il lavoro.',
        translation: 'Monday I start work.'
      },
      {
        italian: 'Martedì',
        english: 'Tuesday',
        pronunciation: 'mar-teh-dee',
        example: 'Martedì ho una riunione.',
        translation: 'Tuesday I have a meeting.'
      },
      {
        italian: 'Mercoledì',
        english: 'Wednesday',
        pronunciation: 'mer-koh-leh-dee',
        example: 'Mercoledì vado dal dentista.',
        translation: 'Wednesday I go to the dentist.'
      },
      {
        italian: 'Gennaio',
        english: 'January',
        pronunciation: 'jehn-nah-yoh',
        example: 'Gennaio è il primo mese.',
        translation: 'January is the first month.'
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
  const fallbackWords = getFallbackVocabulary(theme);
  return [
    {
      category: 'Nouns',
      words: fallbackWords.slice(0, 7)
    },
    {
      category: 'Verbs',
      words: fallbackWords.slice(7, 14)
    },
    {
      category: 'Adjectives',
      words: fallbackWords.slice(14, 20)
    }
  ];
}
