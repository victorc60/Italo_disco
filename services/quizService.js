import OpenAI from 'openai';

/**
 * Quiz Service - Handles quiz generation and practice exercises
 * Uses OpenAI to generate Italian quizzes and practice questions
 */

let openai = null;

/**
 * Initialize OpenAI client
 */
export function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Trim whitespace and newlines from API key (common issue when copying from files)
  const apiKey = process.env.OPENAI_API_KEY.trim().replace(/\r?\n|\r/g, '');
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is empty after trimming');
  }
  
  openai = new OpenAI({
    apiKey: apiKey
  });
  
  console.log('✅ OpenAI initialized for quiz service');
  return openai;
}

/**
 * Generate weekly quiz
 * @param {number} weekNumber - Week number
 * @param {string} theme - Week theme
 * @param {Array} vocabulary - Array of vocabulary words
 * @returns {Object} Quiz object
 */
export async function generateWeeklyQuiz(weekNumber, theme, vocabulary) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const vocabList = vocabulary.map(word => `${word.italian} (${word.english})`).join(', ');
    
    const systemPrompt = `Italian teacher. Generate 10-question quiz for Week ${weekNumber}, theme "${theme}".

Types: multiple_choice, fill_in_blank, translation, vocabulary_matching. Use vocab: ${vocabList.substring(0, 200)}. Beginner-intermediate level. Include explanations.

JSON: {"title":"...","week":${weekNumber},"theme":"${theme}","instructions":"...","questions":[{"type":"multiple_choice","question":"...","question_translation":"...","options":[...],"correct_answer":0,"explanation":"..."},{"type":"fill_in_blank","question":"...","question_translation":"...","correct_answer":"...","explanation":"..."},{"type":"translation","question":"...","question_translation":"...","correct_answer":"...","explanation":"..."},{"type":"vocabulary_matching","question":"...","pairs":[{"italian":"...","english":"..."}],"explanation":"..."}]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Week ${weekNumber}: ${theme}` }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const quiz = JSON.parse(response);
    
    console.log(`✅ Generated weekly quiz for Week ${weekNumber}, theme: ${theme}`);
    return quiz;
    
  } catch (error) {
    console.error('Error generating weekly quiz:', error);
    
    // Fallback quiz
    return getFallbackQuiz(weekNumber, theme);
  }
}

/**
 * Generate practice quiz (shorter version)
 * @param {number} weekNumber - Week number
 * @param {string} theme - Week theme
 * @param {Array} vocabulary - Array of vocabulary words
 * @returns {Object} Practice quiz object
 */
export async function generatePracticeQuiz(weekNumber, theme, vocabulary) {
  try {
    if (!openai) {
      initializeOpenAI();
    }
    
    const vocabList = vocabulary.map(word => `${word.italian} (${word.english})`).join(', ');
    
    const systemPrompt = `Italian teacher. Generate 5-question practice quiz for Week ${weekNumber}, theme "${theme}".

Types: multiple_choice, fill_in_blank, translation. Use vocab: ${vocabList.substring(0, 150)}. Beginner-intermediate level.

JSON: {"title":"Practice Quiz","week":${weekNumber},"theme":"${theme}","instructions":"...","questions":[{"type":"multiple_choice","question":"...","question_translation":"...","options":[...],"correct_answer":0,"explanation":"..."}]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Week ${weekNumber}: ${theme}` }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    const quiz = JSON.parse(response);
    
    console.log(`✅ Generated practice quiz for Week ${weekNumber}, theme: ${theme}`);
    return quiz;
    
  } catch (error) {
    console.error('Error generating practice quiz:', error);
    
    // Fallback practice quiz
    return getFallbackPracticeQuiz(weekNumber, theme);
  }
}

/**
 * Format quiz message for Telegram
 * @param {Object} quiz - Quiz object
 * @returns {string} Formatted message
 */
export function formatQuizMessage(quiz) {
  let message = `📚 *${quiz.title}* 📚\n\n`;
  message += `*Week ${quiz.week} - ${quiz.theme}*\n\n`;
  message += `*Instructions:*\n`;
  message += `${quiz.instructions}\n\n`;
  
  quiz.questions.forEach((q, index) => {
    message += `*Question ${index + 1}:*\n`;
    
    if (q.type === 'multiple_choice') {
      message += `${q.question}\n`;
      message += `_${q.question_translation}_\n\n`;
      q.options.forEach((option, optIndex) => {
        message += `${optIndex + 1}. ${option}\n`;
      });
      message += `\n*Answer: ${q.options[q.correct_answer]}*\n`;
      message += `_${q.explanation}_\n\n`;
      
    } else if (q.type === 'fill_in_blank') {
      message += `${q.question}\n`;
      message += `_${q.question_translation}_\n\n`;
      message += `*Answer: ${q.correct_answer}*\n`;
      message += `_${q.explanation}_\n\n`;
      
    } else if (q.type === 'translation') {
      message += `${q.question}\n`;
      message += `_${q.question_translation}_\n\n`;
      message += `*Answer: ${q.correct_answer}*\n`;
      message += `_${q.explanation}_\n\n`;
      
    } else if (q.type === 'vocabulary_matching') {
      message += `${q.question}\n`;
      message += `_${q.question_translation}_\n\n`;
      q.pairs.forEach(pair => {
        message += `• ${pair.italian} = ${pair.english}\n`;
      });
      message += `\n_${q.explanation}_\n\n`;
    }
  });
  
  message += `*Scoring:* ${quiz.scoring.total_points} points total (${quiz.scoring.points_per_question} per question)\n\n`;
  message += `*Buona fortuna!* (Good luck!) 🍀✨\n`;
  message += `\n_Tip: Review the vocabulary and try to understand the explanations!_ 📖`;
  
  return message;
}

/**
 * Get fallback quiz when OpenAI fails
 * @param {number} weekNumber - Week number
 * @param {string} theme - Week theme
 * @returns {Object} Fallback quiz object
 */
function getFallbackQuiz(weekNumber, theme) {
  return {
    title: "Weekly Quiz",
    week: weekNumber,
    theme: theme,
    instructions: "Answer the following questions about this week's theme. Take your time and think carefully!",
    questions: [
      {
        type: "multiple_choice",
        question: "Come si dice 'Hello' in italiano?",
        question_translation: "Usually, 'Hello' in Italian is:",
        options: ["Ciao", "Buongiorno", "Buonasera", "Tutte le precedenti"],
        correct_answer: 3,
        explanation: "All of these are correct ways to say hello in Italian, depending on the time and context."
      },
      {
        type: "fill_in_blank",
        question: "Ciao, come ___?",
        question_translation: "Hello, how ___?",
        correct_answer: "stai",
        explanation: "The correct form is 'stai' (you are) when asking 'how are you?'"
      },
      {
        type: "translation",
        question: "Translate to Italian: Thank you",
        question_translation: "Translate to Italian: Thank you",
        correct_answer: "Grazie",
        explanation: "Grazie is the standard way to say thank you in Italian."
      }
    ],
    scoring: {
      total_points: 30,
      points_per_question: 10
    }
  };
}

/**
 * Get fallback practice quiz when OpenAI fails
 * @param {number} weekNumber - Week number
 * @param {string} theme - Week theme
 * @returns {Object} Fallback practice quiz object
 */
function getFallbackPracticeQuiz(weekNumber, theme) {
  return {
    title: "Practice Quiz",
    week: weekNumber,
    theme: theme,
    instructions: "Quick practice quiz! Answer these questions about this week's theme.",
    questions: [
      {
        type: "multiple_choice",
        question: "Qual è la traduzione di 'Good morning'?",
        question_translation: "What is the translation of 'Good morning'?",
        options: ["Buongiorno", "Buonasera", "Buonanotte", "Ciao"],
        correct_answer: 0,
        explanation: "Buongiorno is used to say good morning in Italian."
      },
      {
        type: "translation",
        question: "Translate to Italian: Goodbye",
        question_translation: "Translate to Italian: Goodbye",
        correct_answer: "Arrivederci",
        explanation: "Arrivederci is a formal way to say goodbye in Italian."
      }
    ],
    scoring: {
      total_points: 20,
      points_per_question: 10
    }
  };
}
