import OpenAI from 'openai';

/**
 * Service for generating weekly quizzes
 * Tests vocabulary and concepts learned during the week
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
 * Generate a weekly quiz based on the week's theme and vocabulary
 * @param {number} weekNumber - Week number (1-12)
 * @param {string} theme - Weekly theme
 * @param {Array} weekVocabulary - All vocabulary from the week
 * @returns {Promise<Object>} Generated quiz with questions and answers
 */
export async function generateWeeklyQuiz(weekNumber, theme, weekVocabulary = []) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const vocabList = weekVocabulary.length > 0
      ? weekVocabulary.slice(0, 15).map(w => `${w.italian} - ${w.english}`).join(', ')
      : 'vocabulary from this week';

    const prompt = `Create a quiz for Week ${weekNumber} of Italian language learning.

Theme: "${theme}"
Vocabulary covered: ${vocabList}

Create a quiz with:
1. 5 multiple choice questions (mix of vocabulary, grammar, and comprehension)
2. Each question should have 4 options (A, B, C, D)
3. Include the correct answer for each question
4. Make questions progressively harder
5. Mix question types: translation, fill-in-blank, grammar, usage

Format:
Question 1: [Question text]
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct Answer: [Letter]

Make it challenging but fair for beginner-intermediate learners!`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an Italian language teacher creating fair and educational quizzes to test learners\' knowledge.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;

    return {
      weekNumber,
      theme,
      content,
      totalQuestions: 5,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

/**
 * Generate a quiz in structured JSON format for interactive quizzes
 * @param {number} weekNumber - Week number
 * @param {string} theme - Weekly theme
 * @param {Array} weekVocabulary - Vocabulary from the week
 * @returns {Promise<Array>} Array of question objects
 */
export async function generateStructuredQuiz(weekNumber, theme, weekVocabulary = []) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API not configured');
  }

  try {
    const vocabList = weekVocabulary.length > 0
      ? weekVocabulary.slice(0, 15).map(w => `${w.italian} - ${w.english}`).join(', ')
      : 'basic Italian vocabulary';

    const prompt = `Create a 5-question quiz for Italian learners.

Week ${weekNumber} - Theme: "${theme}"
Vocabulary: ${vocabList}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "What does 'ciao' mean?",
    "options": ["Hello/Goodbye", "Thank you", "Please", "Excuse me"],
    "correctAnswer": 0,
    "explanation": "Ciao is used for both hello and goodbye in informal contexts."
  }
]

Important:
- correctAnswer is the index (0-3) of the correct option
- Mix vocabulary, grammar, and usage questions
- Make questions progressively harder
- Return ONLY the JSON array, no additional text`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator. Return ONLY valid JSON arrays, no additional text.'
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

    const questions = JSON.parse(jsonText);
    return questions;
  } catch (error) {
    console.error('Error generating structured quiz:', error);
    // Return fallback quiz
    return generateFallbackQuiz(theme);
  }
}

/**
 * Fallback quiz if API fails
 */
function generateFallbackQuiz(theme) {
  return [
    {
      question: "What does 'ciao' mean in English?",
      options: ["Hello/Goodbye", "Thank you", "Please", "Good night"],
      correctAnswer: 0,
      explanation: "Ciao is used for both hello and goodbye in informal contexts."
    },
    {
      question: "How do you say 'thank you' in Italian?",
      options: ["Prego", "Grazie", "Scusa", "Ciao"],
      correctAnswer: 1,
      explanation: "Grazie means 'thank you' in Italian."
    },
    {
      question: "What does 'buongiorno' mean?",
      options: ["Good evening", "Good night", "Good morning", "Goodbye"],
      correctAnswer: 2,
      explanation: "Buongiorno means 'good morning' or 'good day'."
    },
    {
      question: "How do you say 'please' in Italian?",
      options: ["Grazie", "Prego", "Per favore", "Scusa"],
      correctAnswer: 2,
      explanation: "Per favore means 'please' in Italian."
    },
    {
      question: "What does 'mi dispiace' mean?",
      options: ["I'm happy", "I'm sorry", "I'm tired", "I'm hungry"],
      correctAnswer: 1,
      explanation: "Mi dispiace means 'I'm sorry' in Italian."
    }
  ];
}

/**
 * Evaluate user's quiz answers
 * @param {Array} questions - Quiz questions with correct answers
 * @param {Array} userAnswers - User's selected answers (indices)
 * @returns {Object} Results with score and feedback
 */
export function evaluateQuiz(questions, userAnswers) {
  let correctCount = 0;
  const results = [];

  questions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === q.correctAnswer;
    
    if (isCorrect) correctCount++;

    results.push({
      questionNumber: index + 1,
      question: q.question,
      userAnswer: q.options[userAnswer],
      correctAnswer: q.options[q.correctAnswer],
      isCorrect,
      explanation: q.explanation
    });
  });

  const score = correctCount;
  const percentage = Math.round((correctCount / questions.length) * 100);
  
  let feedback = '';
  if (percentage >= 80) {
    feedback = '🌟 Eccellente! (Excellent!) You have mastered this week\'s material!';
  } else if (percentage >= 60) {
    feedback = '👍 Bene! (Good!) You\'re doing well, keep practicing!';
  } else {
    feedback = '💪 Keep studying! Review this week\'s vocabulary and try again.';
  }

  return {
    score,
    totalQuestions: questions.length,
    percentage,
    feedback,
    results
  };
}

/**
 * Format quiz for Telegram message
 * @param {Object} quizData - Quiz data from generateWeeklyQuiz
 * @returns {string} Formatted message
 */
export function formatQuizMessage(quizData) {
  return `📝 *Week ${quizData.weekNumber} Quiz - ${quizData.theme}*

Time to test your knowledge! 🎯

${quizData.content}

_Answer each question and send me your answers (e.g., "1A 2B 3C 4D 5A")_ 

Good luck! Buona fortuna! 🍀`;
}

/**
 * Format quiz results for Telegram
 * @param {Object} results - Results from evaluateQuiz
 * @returns {string} Formatted message
 */
export function formatQuizResults(results) {
  let message = `📊 *Quiz Results*\n\n`;
  message += `Score: ${results.score}/${results.totalQuestions} (${results.percentage}%)\n`;
  message += `${results.feedback}\n\n`;
  message += `*Detailed Results:*\n`;

  results.results.forEach((r, index) => {
    const icon = r.isCorrect ? '✅' : '❌';
    message += `\n${icon} *Question ${r.questionNumber}*\n`;
    message += `Your answer: ${r.userAnswer}\n`;
    if (!r.isCorrect) {
      message += `Correct answer: ${r.correctAnswer}\n`;
    }
    message += `_${r.explanation}_\n`;
  });

  return message;
}

/**
 * Format interactive quiz question for Telegram
 * @param {Object} question - Single question object
 * @param {number} questionNumber - Question number
 * @param {number} totalQuestions - Total number of questions
 * @returns {string} Formatted message
 */
export function formatInteractiveQuestion(question, questionNumber, totalQuestions) {
  let message = `❓ *Question ${questionNumber}/${totalQuestions}*\n\n`;
  message += `${question.question}\n\n`;
  
  question.options.forEach((option, index) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, D
    message += `${letter}) ${option}\n`;
  });

  message += `\n_Reply with A, B, C, or D_`;
  
  return message;
}

export default {
  initializeOpenAI,
  generateWeeklyQuiz,
  generateStructuredQuiz,
  evaluateQuiz,
  formatQuizMessage,
  formatQuizResults,
  formatInteractiveQuestion
};

