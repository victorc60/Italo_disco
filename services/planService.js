import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Service for managing the 12-week Italian learning plan
 * Reads from plan.json and provides structured access to curriculum
 */

let planData = null;

/**
 * Load the plan.json file
 * @returns {Promise<Object>} The complete plan data
 */
export async function loadPlan() {
  if (!planData) {
    const planPath = join(__dirname, '..', 'plan.json');
    const data = await readFile(planPath, 'utf-8');
    planData = JSON.parse(data);
  }
  return planData;
}

/**
 * Get a specific week's data
 * @param {number} weekNumber - Week number (1-12)
 * @returns {Promise<Object|null>} Week data or null if not found
 */
export async function getWeek(weekNumber) {
  const plan = await loadPlan();
  return plan.weeks.find(w => w.week === weekNumber) || null;
}

/**
 * Get a specific day's task for a given week
 * @param {number} weekNumber - Week number (1-12)
 * @param {number} dayNumber - Day number (1-7)
 * @returns {Promise<Object|null>} Day data or null if not found
 */
export async function getDayTask(weekNumber, dayNumber) {
  const week = await getWeek(weekNumber);
  if (!week) return null;
  
  return week.days.find(d => d.day === dayNumber) || null;
}

/**
 * Get the theme for a specific week
 * @param {number} weekNumber - Week number (1-12)
 * @returns {Promise<string|null>} Theme name or null
 */
export async function getWeekTheme(weekNumber) {
  const week = await getWeek(weekNumber);
  return week ? week.theme : null;
}

/**
 * Get all vocabulary days for a specific week
 * @param {number} weekNumber - Week number (1-12)
 * @returns {Promise<Array>} Array of vocabulary-focused days
 */
export async function getVocabularyDays(weekNumber) {
  const week = await getWeek(weekNumber);
  if (!week) return [];
  
  return week.days.filter(d => d.focus === 'vocabulary');
}

/**
 * Get the quiz day for a specific week (usually day 7)
 * @param {number} weekNumber - Week number (1-12)
 * @returns {Promise<Object|null>} Quiz day data or null
 */
export async function getQuizDay(weekNumber) {
  const week = await getWeek(weekNumber);
  if (!week) return null;
  
  return week.days.find(d => d.focus === 'quiz') || null;
}

/**
 * Calculate which week and day based on start date
 * @param {Date} startDate - When the user started the program
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {Object} { weekNumber, dayNumber, isActive }
 */
export function calculateProgress(startDate, currentDate = new Date()) {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  
  // Calculate days since start
  const diffTime = current - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate week and day (1-indexed)
  const weekNumber = Math.floor(diffDays / 7) + 1;
  const dayNumber = (diffDays % 7) + 1;
  
  // Check if program is still active (within 12 weeks)
  const isActive = weekNumber >= 1 && weekNumber <= 12;
  
  return {
    weekNumber: Math.min(weekNumber, 12),
    dayNumber: Math.min(dayNumber, 7),
    totalDays: diffDays + 1,
    isActive
  };
}

/**
 * Get current task for user based on their start date
 * @param {Date} startDate - When the user started
 * @returns {Promise<Object>} Current week, day, and task info
 */
export async function getCurrentTask(startDate) {
  const progress = calculateProgress(startDate);
  
  if (!progress.isActive) {
    return {
      completed: true,
      message: 'Congratulations! You have completed the 12-week Italian learning program! 🎉'
    };
  }
  
  const week = await getWeek(progress.weekNumber);
  const dayTask = await getDayTask(progress.weekNumber, progress.dayNumber);
  
  return {
    weekNumber: progress.weekNumber,
    dayNumber: progress.dayNumber,
    totalDays: progress.totalDays,
    theme: week?.theme,
    task: dayTask,
    completed: false
  };
}

/**
 * Get all tasks for the entire week
 * @param {number} weekNumber - Week number (1-12)
 * @returns {Promise<Object|null>} Complete week structure
 */
export async function getWeekOverview(weekNumber) {
  return await getWeek(weekNumber);
}

export default {
  loadPlan,
  getWeek,
  getDayTask,
  getWeekTheme,
  getVocabularyDays,
  getQuizDay,
  calculateProgress,
  getCurrentTask,
  getWeekOverview
};

