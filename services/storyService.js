import OpenAI from 'openai';

/**
 * Service for generating Italian stories using daily vocabulary
 * Creates engaging stories that reinforce learned words
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
 * Generate a short story using the day's vocabulary
 * @param {string} theme - Weekly theme
 * @param {Array} words - Array of words learned today
 * @param {string} difficulty - Story difficulty level (beginner, intermediate, advanced)
 * @returns {Promise<Object>} Generated story with translation
 */
export async function generateStory(theme, words = [], difficulty = 'beginner') {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    // Extract Italian words if words array provided
    const wordList = words.length > 0 
      ? words.map(w => w.italian || w).join(', ')
      : 'vocabulary from today\'s lesson';

    const prompt = `Write a short, engaging story in Italian about: "${theme}"

${words.length > 0 ? `Use these Italian words in the story: ${wordList}` : ''}

Requirements:
- Level: ${difficulty}
- Length: 6-8 sentences
- Make it interesting and relatable
- Use natural, everyday Italian
- Bold the vocabulary words used from today's lesson

After the story, provide:
1. English translation
2. 2-3 comprehension questions in Italian
3. Answers to the questions

Make the story fun and memorable!`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a creative Italian language teacher who writes engaging, educational stories for language learners.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content;

    return {
      theme,
      difficulty,
      content: response,
      wordsUsed: words.length,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
}

/**
 * Generate a story based on the day's task (for reading-focused days)
 * @param {string} theme - Weekly theme
 * @param {string} task - Daily task description
 * @param {Array} weekVocab - All vocabulary from the week so far
 * @returns {Promise<Object>} Generated story
 */
export async function generateTaskBasedStory(theme, task, weekVocab = []) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const wordList = weekVocab.slice(0, 10).map(w => w.italian || w).join(', ');

    const prompt = `Create a story for Italian language learners.

Theme: "${theme}"
Task: "${task}"
${weekVocab.length > 0 ? `Include these words: ${wordList}` : ''}

Create:
1. A short story (8-10 sentences) in Italian
2. Full English translation
3. 3 comprehension questions in Italian with answers
4. Highlight key vocabulary words

Make it engaging and appropriate for beginner-intermediate learners.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an Italian teacher creating educational reading materials.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return {
      theme,
      task,
      content: completion.choices[0].message.content,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating task-based story:', error);
    throw error;
  }
}

/**
 * Generate a practice prompt asking users to create sentences
 * @param {string} theme - Weekly theme
 * @param {Array} words - Words to practice with
 * @returns {Promise<string>} Practice prompt
 */
export async function generatePracticePrompt(theme, words) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const wordList = words.slice(0, 5).map(w => w.italian || w).join(', ');

    const prompt = `Create a fun practice exercise for Italian learners.

Theme: "${theme}"
Words to practice: ${wordList}

Create:
1. A friendly prompt asking users to write 3 sentences using these words
2. Provide 2 example sentences as inspiration
3. Include helpful tips for forming sentences

Keep it encouraging and not too difficult!`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an encouraging Italian teacher creating practice exercises.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating practice prompt:', error);
    throw error;
  }
}

/**
 * Check and provide feedback on user's sentences
 * @param {string} userSentences - Sentences submitted by user
 * @param {string} theme - Current theme
 * @param {Array} words - Target vocabulary words
 * @returns {Promise<string>} Feedback on sentences
 */
export async function checkUserSentences(userSentences, theme, words = []) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const wordList = words.map(w => w.italian || w).join(', ');

    const prompt = `As an Italian teacher, review these sentences written by a learner:

Theme: "${theme}"
Target words: ${wordList}

Student's sentences:
${userSentences}

Provide:
1. Gentle corrections if needed
2. Praise for what they did well
3. Suggestions for improvement
4. Correct versions of any mistakes

Be encouraging and constructive!`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a kind, patient Italian teacher providing constructive feedback to language learners.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1200,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error checking sentences:', error);
    throw error;
  }
}

/**
 * Format story for Telegram message
 * @param {Object} storyData - Story data from generateStory
 * @returns {string} Formatted message
 */
export function formatStoryMessage(storyData) {
  return `📖 *Evening Story - ${storyData.theme}*

${storyData.content}

_Read the story, try to understand it, and answer the questions!_ 🌙`;
}

/**
 * Format practice prompt for Telegram
 * @param {string} promptText - Practice prompt text
 * @returns {string} Formatted message
 */
export function formatPracticeMessage(promptText) {
  return `✍️ *Practice Time!*

${promptText}

_Reply to this message with your sentences and I'll check them!_ 💪`;
}

export default {
  initializeOpenAI,
  generateStory,
  generateTaskBasedStory,
  generatePracticePrompt,
  checkUserSentences,
  formatStoryMessage,
  formatPracticeMessage
};

