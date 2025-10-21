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
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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
    
    const systemPrompt = `You are an expert Italian language teacher. Generate a comprehensive weekly quiz for Week ${weekNumber} covering the theme "${theme}".

Requirements:
- Create 10 questions total
- Include different question types: multiple choice, fill-in-the-blank, translation, and vocabulary matching
- Use vocabulary related to the theme: ${vocabList}
- Make questions appropriate for beginner to intermediate learners
- Include clear explanations for answers
- Focus on the week's theme and vocabulary

Format your response as a JSON object with this structure:
{
  "title": "Quiz title",
  "week": ${weekNumber},
  "theme": "${theme}",
  "instructions": "Clear instructions for taking the quiz",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text in Italian",
      "question_translation": "English translation of question",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": 0,
      "explanation": "Explanation of why this answer is correct"
    },
    {
      "type": "fill_in_blank",
      "question": "Complete the sentence: Ciao, come ___?",
      "question_translation": "Complete the sentence: Hello, how ___?",
      "correct_answer": "stai",
      "explanation": "The correct form is 'stai' (you are)"
    },
    {
      "type": "translation",
      "question": "Translate to Italian: Good morning",
      "question_translation": "Translate to Italian: Good morning",
      "correct_answer": "Buongiorno",
      "explanation": "Buongiorno is the formal way to say good morning"
    },
    {
      "type": "vocabulary_matching",
      "question": "Match the Italian word with its English meaning",
      "question_translation": "Match the Italian word with its English meaning",
      "pairs": [
        {"italian": "Ciao", "english": "Hello"},
        {"italian": "Grazie", "english": "Thank you"}
      ],
      "explanation": "These are basic Italian greetings and expressions"
    }
  ],
  "scoring": {
    "total_points": 100,
    "points_per_question": 10
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate weekly quiz for Week ${weekNumber}, theme: ${theme}` }
      ],
      temperature: 0.7,
      max_tokens: 3000,
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
    
    const systemPrompt = `You are an expert Italian language teacher. Generate a short practice quiz for Week ${weekNumber} covering the theme "${theme}".

Requirements:
- Create 5 questions total
- Include different question types: multiple choice, fill-in-the-blank, and translation
- Use vocabulary related to the theme: ${vocabList}
- Make questions appropriate for beginner to intermediate learners
- Keep it shorter than the weekly quiz

Format your response as a JSON object with this structure:
{
  "title": "Practice Quiz",
  "week": ${weekNumber},
  "theme": "${theme}",
  "instructions": "Quick practice quiz instructions",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text in Italian",
      "question_translation": "English translation of question",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": 0,
      "explanation": "Brief explanation"
    }
  ],
  "scoring": {
    "total_points": 50,
    "points_per_question": 10
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate practice quiz for Week ${weekNumber}, theme: ${theme}` }
      ],
      temperature: 0.7,
      max_tokens: 1500,
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
