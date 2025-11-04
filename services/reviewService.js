import * as db from './db.js';

/**
 * Review Service - Handles spaced repetition and vocabulary review
 * Implements optimal review intervals based on cognitive science
 */

/**
 * Spaced repetition intervals (in days)
 * Words are reviewed at these intervals after first learning
 */
const REVIEW_INTERVALS = {
  1: 1,   // Review after 1 day
  2: 3,   // Review after 3 days
  3: 7,   // Review after 7 days
  4: 14,  // Review after 14 days
  5: 30   // Review after 30 days (mastered)
};

/**
 * Get words that need review today based on spaced repetition
 * @param {number} userId - User ID
 * @param {number} weekNumber - Current week number
 * @param {Date} startDate - User's start date
 * @returns {Array} Array of words that need review
 */
export async function getWordsForReview(userId, weekNumber, startDate) {
  try {
    const allWords = [];
    
    // Get vocabulary from current week and previous weeks
    const weeksToReview = Math.min(weekNumber, 4); // Review up to 4 weeks back
    
    for (let week = Math.max(1, weekNumber - weeksToReview + 1); week <= weekNumber; week++) {
      const weekVocab = await db.getWeekVocabulary(userId, week);
      
      for (const word of weekVocab) {
        // Calculate when this word was learned
        const wordData = await getWordReviewData(userId, week, word);
        
        if (shouldReviewWord(wordData, startDate)) {
          allWords.push({
            ...word,
            weekLearned: week,
            reviewLevel: wordData.reviewLevel || 1,
            lastReviewed: wordData.lastReviewed
          });
        }
      }
    }
    
    // Limit to 15-20 words per review session
    return allWords.slice(0, 20);
  } catch (error) {
    console.error('Error getting words for review:', error);
    return [];
  }
}

/**
 * Check if a word should be reviewed today
 * @param {Object} wordData - Word review data
 * @param {Date} startDate - User's start date
 * @returns {boolean} True if word should be reviewed
 */
function shouldReviewWord(wordData, startDate) {
  if (!wordData.lastReviewed) {
    // Never reviewed, review if learned more than 1 day ago
    const daysSinceLearned = getDaysSinceDate(wordData.dateLearned || startDate);
    return daysSinceLearned >= 1;
  }
  
  const daysSinceReview = getDaysSinceDate(wordData.lastReviewed);
  const currentReviewLevel = wordData.reviewLevel || 1;
  const interval = REVIEW_INTERVALS[currentReviewLevel] || 1;
  
  return daysSinceReview >= interval;
}

/**
 * Get review data for a specific word
 * @param {number} userId - User ID
 * @param {number} weekNumber - Week number
 * @param {Object} word - Word object
 * @returns {Object} Review data
 */
async function getWordReviewData(userId, weekNumber, word) {
  try {
    // In a real implementation, this would query a review database
    // For now, use in-memory storage
    const key = `${userId}_${weekNumber}_${word.italian}`;
    
    if (!global.reviewStorage) {
      global.reviewStorage = new Map();
    }
    
    const reviewData = global.reviewStorage.get(key) || {
      reviewLevel: 1,
      dateLearned: new Date(),
      lastReviewed: null,
      correctCount: 0,
      incorrectCount: 0
    };
    
    return reviewData;
  } catch (error) {
    console.error('Error getting word review data:', error);
    return {
      reviewLevel: 1,
      dateLearned: new Date(),
      lastReviewed: null
    };
  }
}

/**
 * Update word review status after user reviews it
 * @param {number} userId - User ID
 * @param {number} weekNumber - Week number
 * @param {Object} word - Word object
 * @param {boolean} correct - Whether user got it correct
 */
export async function updateWordReview(userId, weekNumber, word, correct) {
  try {
    const key = `${userId}_${weekNumber}_${word.italian}`;
    
    if (!global.reviewStorage) {
      global.reviewStorage = new Map();
    }
    
    const reviewData = await getWordReviewData(userId, weekNumber, word);
    
    if (correct) {
      reviewData.correctCount = (reviewData.correctCount || 0) + 1;
      
      // Advance to next review level if answered correctly multiple times
      if (reviewData.correctCount >= 2) {
        reviewData.reviewLevel = Math.min((reviewData.reviewLevel || 1) + 1, 5);
        reviewData.correctCount = 0; // Reset counter
      }
    } else {
      reviewData.incorrectCount = (reviewData.incorrectCount || 0) + 1;
      
      // Reset review level if answered incorrectly
      if (reviewData.incorrectCount >= 2) {
        reviewData.reviewLevel = Math.max((reviewData.reviewLevel || 1) - 1, 1);
        reviewData.incorrectCount = 0; // Reset counter
      }
    }
    
    reviewData.lastReviewed = new Date();
    global.reviewStorage.set(key, reviewData);
    
    console.log(`✅ Updated review for word: ${word.italian}, correct: ${correct}, level: ${reviewData.reviewLevel}`);
  } catch (error) {
    console.error('Error updating word review:', error);
  }
}

/**
 * Get days since a specific date
 * @param {Date} date - Date to calculate from
 * @returns {number} Days since date
 */
function getDaysSinceDate(date) {
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate active recall quiz for review words
 * @param {Array} words - Words to review
 * @returns {Object} Quiz object
 */
export function generateReviewQuiz(words) {
  if (!words || words.length === 0) {
    return null;
  }
  
  // Select 8-10 words for review session
  const wordsToReview = words.slice(0, 10);
  
  const questions = wordsToReview.map((word, index) => {
    // Create active recall question (user must produce, not just recognize)
    const questionTypes = ['translation', 'sentence_completion', 'definition'];
    const type = questionTypes[index % questionTypes.length];
    
    if (type === 'translation') {
      return {
        type: 'translation',
        question: `Translate to Italian: "${word.english}"`,
        correctAnswer: word.italian,
        word: word,
        explanation: `${word.italian} - ${word.pronunciation}`
      };
    } else if (type === 'sentence_completion') {
      // Use example sentence with blank
      const example = word.example || `${word.italian} è bello.`;
      const blanked = example.replace(word.italian, '_____');
      
      return {
        type: 'completion',
        question: `Complete: ${blanked}`,
        correctAnswer: word.italian,
        word: word,
        explanation: `Correct: ${example}`
      };
    } else {
      return {
        type: 'definition',
        question: `What does "${word.italian}" mean?`,
        correctAnswer: word.english,
        word: word,
        explanation: `${word.italian} means "${word.english}" - ${word.pronunciation}`
      };
    }
  });
  
  return {
    title: 'Daily Review Quiz',
    wordsCount: wordsToReview.length,
    questions,
    instructions: 'Test your recall! Try to remember without looking at the answer.'
  };
}

/**
 * Get review statistics for user
 * @param {number} userId - User ID
 * @returns {Object} Review statistics
 */
export async function getReviewStats(userId) {
  try {
    if (!global.reviewStorage) {
      return {
        totalWordsReviewed: 0,
        masteredWords: 0,
        wordsToReview: 0
      };
    }
    
    let totalReviewed = 0;
    let mastered = 0;
    let needsReview = 0;
    
    // Count words in review storage
    for (const [key, data] of global.reviewStorage.entries()) {
      if (key.startsWith(`${userId}_`)) {
        totalReviewed++;
        if (data.reviewLevel >= 5) {
          mastered++;
        }
        if (data.reviewLevel < 3) {
          needsReview++;
        }
      }
    }
    
    return {
      totalWordsReviewed: totalReviewed,
      masteredWords: mastered,
      wordsToReview: needsReview
    };
  } catch (error) {
    console.error('Error getting review stats:', error);
    return {
      totalWordsReviewed: 0,
      masteredWords: 0,
      wordsToReview: 0
    };
  }
}
