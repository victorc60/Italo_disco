import OpenAI from 'openai';

/**
 * Story Service - Handles story generation, practice prompts, and reading comprehension
 * Uses OpenAI to generate Italian stories and practice exercises
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
  
  console.log('✅ OpenAI initialized for story service');
  return openai;
}

/**
 * Generate a story based on task and vocabulary
 * @param {string} theme - Week theme
 * @param {string} task - Daily task description
 * @param {Array} vocabulary - Array of vocabulary words
 * @returns {Object} Story object
 */
export async function generateTaskBasedStory(theme, task, vocabulary) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const vocabList = vocabulary.map(word => `${word.italian} (${word.english})`).join(', ');
    
    const systemPrompt = `Italian teacher. Generate 150-200 word story for "${theme}".

Use vocab: ${vocabList.substring(0, 200)}. Beginner-intermediate level. Add 3 comprehension questions.

JSON: {"title":"...","story":"...","translation":"...","vocabulary_used":[...],"questions":[{"question":"...","translation":"...","answer":"...","answer_translation":"..."}]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Theme: ${theme}` }
      ],
      temperature: 0.8,
      max_tokens: 1800,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const story = JSON.parse(response);
    
    console.log(`✅ Generated story for theme: ${theme}`);
    return story;
    
  } catch (error) {
    console.error('Error generating story:', error);
    
    // Fallback story
    return getFallbackStory(theme);
  }
}

/**
 * Generate practice prompt for writing exercises
 * @param {string} theme - Week theme
 * @param {Array} vocabulary - Array of vocabulary words
 * @returns {Object} Practice prompt object
 */
export async function generatePracticePrompt(theme, vocabulary) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const vocabList = vocabulary.map(word => `${word.italian} (${word.english})`).join(', ');
    
    const systemPrompt = `Italian teacher. Generate writing exercise for "${theme}".

Use vocab: ${vocabList.substring(0, 150)}. Beginner-intermediate level.

JSON: {"title":"...","instructions":"...","prompt":"...","prompt_translation":"...","vocabulary_to_use":[...],"example_response":"...","example_translation":"...","tips":[...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Theme: ${theme}` }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const practicePrompt = JSON.parse(response);
    
    console.log(`✅ Generated practice prompt for theme: ${theme}`);
    return practicePrompt;
    
  } catch (error) {
    console.error('Error generating practice prompt:', error);
    
    // Fallback practice prompt
    return getFallbackPracticePrompt(theme);
  }
}

/**
 * Check user's practice sentences and provide feedback
 * @param {string} userSentences - User's submitted sentences
 * @param {string} theme - Week theme
 * @param {Array} vocabulary - Array of vocabulary words
 * @returns {string} Feedback message
 */
export async function checkUserSentences(userSentences, theme, vocabulary) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const vocabList = vocabulary.map(word => `${word.italian} (${word.english})`).join(', ');
    
    const systemPrompt = `Italian teacher. Review student sentences. Check grammar, vocabulary, coherence. Provide constructive feedback. Theme: "${theme}". Vocab: ${vocabList.substring(0, 150)}. Be encouraging.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Review: ${userSentences.substring(0, 500)}` }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const feedback = completion.choices[0].message.content;
    
    console.log(`✅ Generated feedback for user sentences`);
    return feedback;
    
  } catch (error) {
    console.error('Error checking user sentences:', error);
    
    return `Grazie per aver condiviso le tue frasi! (Thank you for sharing your sentences!)

I'm sorry, but I'm having trouble providing detailed feedback right now. Please keep practicing with the vocabulary we've learned about ${theme}. 

Your effort to write in Italian is commendable! Keep up the great work! 💪🇮🇹`;
  }
}

/**
 * Format story message for Telegram
 * @param {Object} story - Story object
 * @returns {string} Formatted message
 */
export function formatStoryMessage(story) {
  let message = `📖 *Reading Practice* 📖\n\n`;
  message += `*${story.title}*\n\n`;
  message += `${story.story}\n\n`;
  message += `*English Translation:*\n`;
  message += `${story.translation}\n\n`;
  
  if (story.vocabulary_used && story.vocabulary_used.length > 0) {
    message += `*Vocabulary Used:*\n`;
    story.vocabulary_used.forEach(word => {
      message += `• ${word}\n`;
    });
    message += `\n`;
  }
  
  if (story.questions && story.questions.length > 0) {
    message += `*Comprehension Questions:*\n\n`;
    story.questions.forEach((q, index) => {
      message += `*${index + 1}. ${q.question}*\n`;
      message += `_${q.translation}_\n\n`;
    });
  }
  
  message += `\n*Buona lettura!* (Happy reading!) 📚✨`;
  
  return message;
}

/**
 * Format practice message for Telegram
 * @param {Object} practicePrompt - Practice prompt object
 * @returns {string} Formatted message
 */
export function formatPracticeMessage(practicePrompt) {
  let message = `✍️ *Writing Practice* ✍️\n\n`;
  message += `*${practicePrompt.title}*\n\n`;
  message += `*Instructions:*\n`;
  message += `${practicePrompt.instructions}\n\n`;
  message += `*Your Task:*\n`;
  message += `${practicePrompt.prompt}\n`;
  message += `_${practicePrompt.prompt_translation}_\n\n`;
  
  if (practicePrompt.vocabulary_to_use && practicePrompt.vocabulary_to_use.length > 0) {
    message += `*Vocabulary to Use:*\n`;
    practicePrompt.vocabulary_to_use.forEach(word => {
      message += `• ${word}\n`;
    });
    message += `\n`;
  }
  
  if (practicePrompt.example_response) {
    message += `*Example Response:*\n`;
    message += `${practicePrompt.example_response}\n`;
    message += `_${practicePrompt.example_translation}_\n\n`;
  }
  
  if (practicePrompt.tips && practicePrompt.tips.length > 0) {
    message += `*Tips:*\n`;
    practicePrompt.tips.forEach(tip => {
      message += `• ${tip}\n`;
    });
    message += `\n`;
  }
  
  message += `\n*Buona scrittura!* (Happy writing!) ✍️✨\n`;
  message += `\n_Type your response and I'll provide feedback!_ 💬`;
  
  return message;
}

/**
 * Get fallback story when OpenAI fails
 * @param {string} theme - Week theme
 * @returns {Object} Fallback story object
 */
function getFallbackStory(theme) {
  return {
    title: "Una Storia Semplice",
    story: "Ciao! Mi chiamo Marco. Sono italiano e vivo a Roma. Oggi è una bella giornata. Il sole splende e gli uccelli cantano. Marco va al parco per camminare. Incontra un amico e si salutano. 'Buongiorno, come stai?' chiede Marco. 'Sto bene, grazie!' risponde l'amico. Poi vanno insieme al bar per prendere un caffè.",
    translation: "Hello! My name is Marco. I am Italian and I live in Rome. Today is a beautiful day. The sun is shining and the birds are singing. Marco goes to the park to walk. He meets a friend and they greet each other. 'Good morning, how are you?' asks Marco. 'I'm fine, thank you!' replies the friend. Then they go together to the bar to have a coffee.",
    vocabulary_used: ["Ciao", "Buongiorno", "grazie"],
    questions: [
      {
        question: "Come si chiama il protagonista?",
        translation: "What is the protagonist's name?",
        answer: "Si chiama Marco",
        answer_translation: "His name is Marco"
      },
      {
        question: "Dove vive Marco?",
        translation: "Where does Marco live?",
        answer: "Vive a Roma",
        answer_translation: "He lives in Rome"
      },
      {
        question: "Cosa fanno Marco e il suo amico?",
        translation: "What do Marco and his friend do?",
        answer: "Vanno al bar per prendere un caffè",
        answer_translation: "They go to the bar to have a coffee"
      }
    ]
  };
}

/**
 * Get fallback practice prompt when OpenAI fails
 * @param {string} theme - Week theme
 * @returns {Object} Fallback practice prompt object
 */
function getFallbackPracticePrompt(theme) {
  return {
    title: "Writing Practice",
    instructions: "Write 3-5 sentences in Italian about the theme using the vocabulary we've learned.",
    prompt: `Scrivi 3-5 frasi in italiano su "${theme}". Usa le parole che abbiamo imparato.`,
    prompt_translation: `Write 3-5 sentences in Italian about "${theme}". Use the words we've learned.`,
    vocabulary_to_use: ["vocabulary", "words", "from", "this", "week"],
    example_response: "Oggi parlo italiano. Studio molto. Mi piace imparare nuove parole.",
    example_translation: "Today I speak Italian. I study a lot. I like learning new words.",
    tips: [
      "Start with simple sentences",
      "Use vocabulary from this week",
      "Don't worry about perfection",
      "Practice makes perfect!"
    ]
  };
}
