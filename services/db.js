import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Service - Handles all database operations
 * Manages user data, progress tracking, and vocabulary storage
 */

let connection = null;

/**
 * Initialize database connection
 */
export async function initializeDatabase() {
  try {
    // For now, we'll use a simple in-memory storage
    // In production, you would connect to MySQL/PostgreSQL
    console.log('✅ Database initialized (in-memory storage)');
    
    // Initialize in-memory storage
    if (!global.userStorage) {
      global.userStorage = new Map();
    }
    if (!global.vocabularyStorage) {
      global.vocabularyStorage = new Map();
    }
    if (!global.progressStorage) {
      global.progressStorage = new Map();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

/**
 * Register a new user
 * @param {number} userId - Telegram user ID
 * @param {string} username - Telegram username
 * @param {string} firstName - User's first name
 * @returns {Object} User object
 */
export async function registerUser(userId, username, firstName) {
  try {
    const user = {
      user_id: userId,
      username: username || null,
      first_name: firstName,
      start_date: new Date(),
      is_active: true,
      created_at: new Date()
    };
    
    global.userStorage.set(userId, user);
    console.log(`✅ User registered: ${firstName} (ID: ${userId})`);
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Object|null} User object or null
 */
export async function getUser(userId) {
  try {
    return global.userStorage.get(userId) || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get all active users
 * @returns {Array} Array of active users
 */
export async function getAllActiveUsers() {
  try {
    const users = Array.from(global.userStorage.values())
      .filter(user => user.is_active);
    return users;
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
}

/**
 * Update user start date (for testing)
 * @param {number} userId - User ID
 * @param {Date} newStartDate - New start date
 */
export async function updateUserStartDate(userId, newStartDate) {
  try {
    const user = global.userStorage.get(userId);
    if (user) {
      user.start_date = newStartDate;
      global.userStorage.set(userId, user);
      console.log(`✅ Updated start date for user ${userId}`);
    }
  } catch (error) {
    console.error('Error updating user start date:', error);
    throw error;
  }
}

/**
 * Save vocabulary for a user and week
 * @param {number} userId - User ID
 * @param {number} weekNumber - Week number
 * @param {Array} vocabulary - Array of vocabulary objects
 */
export async function saveVocabulary(userId, weekNumber, vocabulary) {
  try {
    const key = `${userId}_${weekNumber}`;
    global.vocabularyStorage.set(key, {
      userId,
      weekNumber,
      vocabulary,
      saved_at: new Date()
    });
    
    console.log(`✅ Vocabulary saved for user ${userId}, week ${weekNumber}`);
  } catch (error) {
    console.error('Error saving vocabulary:', error);
    throw error;
  }
}

/**
 * Get vocabulary for a user and week
 * @param {number} userId - User ID
 * @param {number} weekNumber - Week number
 * @returns {Array} Array of vocabulary objects
 */
export async function getWeekVocabulary(userId, weekNumber) {
  try {
    const key = `${userId}_${weekNumber}`;
    const vocabData = global.vocabularyStorage.get(key);
    
    if (vocabData && vocabData.vocabulary) {
      return vocabData.vocabulary;
    }
    
    // Return empty array if no vocabulary found
    return [];
  } catch (error) {
    console.error('Error getting week vocabulary:', error);
    return [];
  }
}

/**
 * Save daily progress
 * @param {number} userId - User ID
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number
 * @param {Object} progress - Progress data
 */
export async function saveDailyProgress(userId, weekNumber, dayNumber, progress) {
  try {
    const key = `${userId}_${weekNumber}_${dayNumber}`;
    global.progressStorage.set(key, {
      userId,
      weekNumber,
      dayNumber,
      progress,
      completed_at: new Date()
    });
    
    console.log(`✅ Progress saved for user ${userId}, week ${weekNumber}, day ${dayNumber}`);
  } catch (error) {
    console.error('Error saving daily progress:', error);
    throw error;
  }
}

/**
 * Get daily progress
 * @param {number} userId - User ID
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number
 * @returns {Object|null} Progress object or null
 */
export async function getDailyProgress(userId, weekNumber, dayNumber) {
  try {
    const key = `${userId}_${weekNumber}_${dayNumber}`;
    const progressData = global.progressStorage.get(key);
    
    if (progressData && progressData.progress) {
      return progressData.progress;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting daily progress:', error);
    return null;
  }
}

/**
 * Get user statistics
 * @param {number} userId - User ID
 * @returns {Object} User statistics
 */
export async function getUserStats(userId) {
  try {
    const user = await getUser(userId);
    if (!user) {
      return null;
    }
    
    // Count vocabulary learned
    let totalVocabulary = 0;
    for (let week = 1; week <= 12; week++) {
      const vocab = await getWeekVocabulary(userId, week);
      totalVocabulary += vocab.length;
    }
    
    // Count completed days
    let completedDays = 0;
    for (let week = 1; week <= 12; week++) {
      for (let day = 1; day <= 7; day++) {
        const progress = await getDailyProgress(userId, week, day);
        if (progress && progress.taskCompleted) {
          completedDays++;
        }
      }
    }
    
    return {
      userId,
      totalVocabulary,
      completedDays,
      startDate: user.start_date,
      isActive: user.is_active
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  try {
    if (connection) {
      await connection.end();
      connection = null;
    }
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

/**
 * Reset user data (for testing)
 * @param {number} userId - User ID
 */
export async function resetUserData(userId) {
  try {
    // Remove user data
    global.userStorage.delete(userId);
    
    // Remove vocabulary data
    for (let week = 1; week <= 12; week++) {
      const key = `${userId}_${week}`;
      global.vocabularyStorage.delete(key);
    }
    
    // Remove progress data
    for (let week = 1; week <= 12; week++) {
      for (let day = 1; day <= 7; day++) {
        const key = `${userId}_${week}_${day}`;
        global.progressStorage.delete(key);
      }
    }
    
    console.log(`✅ User data reset for user ${userId}`);
  } catch (error) {
    console.error('Error resetting user data:', error);
    throw error;
  }
}
