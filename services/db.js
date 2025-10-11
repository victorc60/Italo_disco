import mysql from 'mysql2/promise';

/**
 * Database service for managing users and their learning progress
 * Uses MySQL for production, with graceful fallback for development
 */

let pool = null;

/**
 * Initialize database connection pool
 * @returns {Promise<mysql.Pool|null>} Connection pool or null if unavailable
 */
export async function initializeDatabase() {
  try {
    // Check if MySQL credentials are provided
    if (!process.env.MYSQL_HOST || !process.env.MYSQL_DATABASE) {
      console.log('⚠️  MySQL not configured. Running in demo mode (no persistence).');
      return null;
    }

    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();

    // Create tables if they don't exist
    await createTables();

    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Running in demo mode without database persistence.');
    return null;
  }
}

/**
 * Create necessary database tables
 */
async function createTables() {
  if (!pool) return;

  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        username VARCHAR(255),
        first_name VARCHAR(255),
        start_date DATE NOT NULL,
        current_week INT DEFAULT 1,
        current_day INT DEFAULT 1,
        timezone VARCHAR(50) DEFAULT 'UTC',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Daily progress tracking
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS daily_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT,
        week_number INT,
        day_number INT,
        task_completed BOOLEAN DEFAULT FALSE,
        words_learned TEXT,
        story_read BOOLEAN DEFAULT FALSE,
        sentences_submitted TEXT,
        completed_at TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
        UNIQUE KEY unique_day (telegram_id, week_number, day_number)
      )
    `);

    // Weekly quiz results
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT,
        week_number INT,
        score INT,
        total_questions INT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
      )
    `);

    // Vocabulary learned by users
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_vocabulary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT,
        week_number INT,
        italian_word VARCHAR(255),
        english_translation VARCHAR(255),
        example_sentence TEXT,
        learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database tables created/verified');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  }
}

/**
 * Register or get existing user
 * @param {number} telegramId - User's Telegram ID
 * @param {string} username - Username
 * @param {string} firstName - First name
 * @returns {Promise<Object>} User data
 */
export async function registerUser(telegramId, username = null, firstName = null) {
  if (!pool) {
    return {
      telegram_id: telegramId,
      start_date: new Date(),
      current_week: 1,
      current_day: 1,
      is_active: true
    };
  }

  try {
    // Check if user exists
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Create new user
    await pool.execute(
      'INSERT INTO users (telegram_id, username, first_name, start_date) VALUES (?, ?, ?, ?)',
      [telegramId, username, firstName, new Date()]
    );

    return {
      telegram_id: telegramId,
      username,
      first_name: firstName,
      start_date: new Date(),
      current_week: 1,
      current_day: 1,
      is_active: true
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Get user data
 * @param {number} telegramId - User's Telegram ID
 * @returns {Promise<Object|null>} User data or null
 */
export async function getUser(telegramId) {
  if (!pool) return null;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get all active users
 * @returns {Promise<Array>} Array of active users
 */
export async function getAllActiveUsers() {
  if (!pool) return [];

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE is_active = TRUE'
    );
    return rows;
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
}

/**
 * Update user progress
 * @param {number} telegramId - User's Telegram ID
 * @param {number} week - Current week
 * @param {number} day - Current day
 */
export async function updateUserProgress(telegramId, week, day) {
  if (!pool) return;

  try {
    await pool.execute(
      'UPDATE users SET current_week = ?, current_day = ?, updated_at = NOW() WHERE telegram_id = ?',
      [week, day, telegramId]
    );
  } catch (error) {
    console.error('Error updating user progress:', error);
  }
}

/**
 * Save daily progress
 * @param {number} telegramId - User's Telegram ID
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number
 * @param {Object} progressData - Progress details
 */
export async function saveDailyProgress(telegramId, weekNumber, dayNumber, progressData) {
  if (!pool) return;

  try {
    await pool.execute(
      `INSERT INTO daily_progress 
       (telegram_id, week_number, day_number, task_completed, words_learned, story_read, sentences_submitted, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       task_completed = VALUES(task_completed),
       words_learned = VALUES(words_learned),
       story_read = VALUES(story_read),
       sentences_submitted = VALUES(sentences_submitted),
       completed_at = NOW()`,
      [
        telegramId,
        weekNumber,
        dayNumber,
        progressData.taskCompleted || false,
        progressData.wordsLearned || null,
        progressData.storyRead || false,
        progressData.sentencesSubmitted || null
      ]
    );
  } catch (error) {
    console.error('Error saving daily progress:', error);
  }
}

/**
 * Save quiz result
 * @param {number} telegramId - User's Telegram ID
 * @param {number} weekNumber - Week number
 * @param {number} score - Score achieved
 * @param {number} totalQuestions - Total questions
 */
export async function saveQuizResult(telegramId, weekNumber, score, totalQuestions) {
  if (!pool) return;

  try {
    await pool.execute(
      'INSERT INTO quiz_results (telegram_id, week_number, score, total_questions) VALUES (?, ?, ?, ?)',
      [telegramId, weekNumber, score, totalQuestions]
    );
  } catch (error) {
    console.error('Error saving quiz result:', error);
  }
}

/**
 * Save learned vocabulary
 * @param {number} telegramId - User's Telegram ID
 * @param {number} weekNumber - Week number
 * @param {Array} words - Array of word objects
 */
export async function saveVocabulary(telegramId, weekNumber, words) {
  if (!pool) return;

  try {
    for (const word of words) {
      await pool.execute(
        'INSERT INTO user_vocabulary (telegram_id, week_number, italian_word, english_translation, example_sentence) VALUES (?, ?, ?, ?, ?)',
        [telegramId, weekNumber, word.italian, word.english, word.example]
      );
    }
  } catch (error) {
    console.error('Error saving vocabulary:', error);
  }
}

/**
 * Get user's vocabulary for a week
 * @param {number} telegramId - User's Telegram ID
 * @param {number} weekNumber - Week number
 * @returns {Promise<Array>} Array of words
 */
export async function getWeekVocabulary(telegramId, weekNumber) {
  if (!pool) return [];

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM user_vocabulary WHERE telegram_id = ? AND week_number = ?',
      [telegramId, weekNumber]
    );
    return rows;
  } catch (error) {
    console.error('Error getting vocabulary:', error);
    return [];
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
}

export default {
  initializeDatabase,
  registerUser,
  getUser,
  getAllActiveUsers,
  updateUserProgress,
  saveDailyProgress,
  saveQuizResult,
  saveVocabulary,
  getWeekVocabulary,
  closeDatabase
};

