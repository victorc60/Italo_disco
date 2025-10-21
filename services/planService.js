import fs from 'fs/promises';
import path from 'path';

/**
 * Plan Service - Manages daily learning plans and curriculum structure
 * Generates 1-7 day plans with different learning activities
 */

// Daily learning activities for each day of the week
const DAILY_ACTIVITIES = {
  1: { focus: 'vocabulary', task: 'Learn 20 new words and their meanings' },
  2: { focus: 'grammar', task: 'Study grammar rules and sentence structure' },
  3: { focus: 'reading', task: 'Read a short story or article' },
  4: { focus: 'listening', task: 'Listen to Italian audio and practice comprehension' },
  5: { focus: 'speaking', task: 'Practice pronunciation and speaking exercises' },
  6: { focus: 'writing', task: 'Write sentences and short paragraphs' },
  7: { focus: 'review', task: 'Review and practice everything learned this week' }
};

/**
 * Load the plan data from plan.json
 */
async function loadPlanData() {
  try {
    const planPath = path.join(process.cwd(), 'plan.json');
    const planData = await fs.readFile(planPath, 'utf8');
    return JSON.parse(planData);
  } catch (error) {
    console.error('Error loading plan data:', error);
    throw error;
  }
}

/**
 * Generate daily plan for a specific week and day
 * @param {number} weekNumber - Week number (1-12)
 * @param {number} dayNumber - Day number (1-7)
 * @returns {Object} Daily plan object
 */
export async function generateDailyPlan(weekNumber, dayNumber) {
  try {
    const planData = await loadPlanData();
    
    // Find the week data
    const weekData = planData.weeks.find(w => w.week === weekNumber);
    if (!weekData) {
      throw new Error(`Week ${weekNumber} not found in plan data`);
    }
    
    // Get the daily activity
    const dailyActivity = DAILY_ACTIVITIES[dayNumber];
    if (!dailyActivity) {
      throw new Error(`Day ${dayNumber} not found in daily activities`);
    }
    
    // Generate the complete daily plan
    const dailyPlan = {
      weekNumber,
      dayNumber,
      theme: weekData.theme,
      focus: dailyActivity.focus,
      task: dailyActivity.task,
      description: generateTaskDescription(weekData.theme, dailyActivity),
      exercises: generateExercises(weekData.theme, dailyActivity.focus),
      estimatedTime: getEstimatedTime(dailyActivity.focus)
    };
    
    return dailyPlan;
  } catch (error) {
    console.error('Error generating daily plan:', error);
    throw error;
  }
}

/**
 * Get current task based on start date
 * @param {Date} startDate - User's start date
 * @returns {Object} Current task information
 */
export function getCurrentTask(startDate) {
  const now = new Date();
  const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  
  // Calculate week and day
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;
  const dayNumber = (daysSinceStart % 7) + 1;
  
  // Check if program is completed (12 weeks = 84 days)
  if (daysSinceStart >= 84) {
    return { completed: true };
  }
  
  return {
    weekNumber: Math.min(weekNumber, 12),
    dayNumber,
    totalDays: daysSinceStart + 1,
    completed: false
  };
}

/**
 * Get week overview with all 7 days
 * @param {number} weekNumber - Week number (1-12)
 * @returns {Object} Week overview
 */
export async function getWeekOverview(weekNumber) {
  try {
    const planData = await loadPlanData();
    const weekData = planData.weeks.find(w => w.week === weekNumber);
    
    if (!weekData) {
      throw new Error(`Week ${weekNumber} not found`);
    }
    
    const days = [];
    for (let day = 1; day <= 7; day++) {
      const dailyActivity = DAILY_ACTIVITIES[day];
      days.push({
        day,
        focus: dailyActivity.focus,
        task: dailyActivity.task,
        estimatedTime: getEstimatedTime(dailyActivity.focus)
      });
    }
    
    return {
      week: weekNumber,
      theme: weekData.theme,
      days
    };
  } catch (error) {
    console.error('Error getting week overview:', error);
    throw error;
  }
}

/**
 * Generate task description based on theme and activity
 * @param {string} theme - Week theme
 * @param {Object} activity - Daily activity object
 * @returns {string} Detailed task description
 */
function generateTaskDescription(theme, activity) {
  const descriptions = {
    vocabulary: `Learn 20 new Italian words related to "${theme}". Focus on pronunciation, meaning, and usage in sentences.`,
    grammar: `Study Italian grammar rules related to "${theme}". Practice sentence structure and verb conjugations.`,
    reading: `Read a short Italian text about "${theme}". Focus on comprehension and new vocabulary.`,
    listening: `Listen to Italian audio content about "${theme}". Practice understanding spoken Italian.`,
    speaking: `Practice speaking Italian about "${theme}". Focus on pronunciation and fluency.`,
    writing: `Write Italian sentences and short paragraphs about "${theme}". Practice grammar and vocabulary.`,
    review: `Review all vocabulary and grammar from this week's theme: "${theme}". Practice with exercises and quizzes.`
  };
  
  return descriptions[activity.focus] || activity.task;
}

/**
 * Generate exercises for the daily activity
 * @param {string} theme - Week theme
 * @param {string} focus - Daily focus
 * @returns {Array} Array of exercise objects
 */
function generateExercises(theme, focus) {
  const exerciseTemplates = {
    vocabulary: [
      { type: 'flashcards', description: 'Practice with vocabulary flashcards' },
      { type: 'matching', description: 'Match Italian words with English translations' },
      { type: 'fill-in', description: 'Fill in the blanks with correct vocabulary' }
    ],
    grammar: [
      { type: 'conjugation', description: 'Practice verb conjugations' },
      { type: 'sentence-building', description: 'Build sentences with correct grammar' },
      { type: 'correction', description: 'Correct grammar mistakes in sentences' }
    ],
    reading: [
      { type: 'comprehension', description: 'Answer questions about the text' },
      { type: 'translation', description: 'Translate key phrases to English' },
      { type: 'summary', description: 'Summarize the main points in Italian' }
    ],
    listening: [
      { type: 'comprehension', description: 'Answer questions about the audio' },
      { type: 'dictation', description: 'Write down what you hear' },
      { type: 'shadowing', description: 'Repeat after the speaker' }
    ],
    speaking: [
      { type: 'pronunciation', description: 'Practice pronunciation of new words' },
      { type: 'conversation', description: 'Practice conversational phrases' },
      { type: 'presentation', description: 'Describe the theme topic in Italian' }
    ],
    writing: [
      { type: 'sentences', description: 'Write 5 sentences using new vocabulary' },
      { type: 'paragraph', description: 'Write a short paragraph about the theme' },
      { type: 'dialogue', description: 'Write a short dialogue between two people' }
    ],
    review: [
      { type: 'quiz', description: 'Take a comprehensive quiz' },
      { type: 'recap', description: 'Review all vocabulary from the week' },
      { type: 'practice', description: 'Practice with mixed exercises' }
    ]
  };
  
  return exerciseTemplates[focus] || [];
}

/**
 * Get estimated time for different activities
 * @param {string} focus - Activity focus
 * @returns {string} Estimated time
 */
function getEstimatedTime(focus) {
  const timeEstimates = {
    vocabulary: '15-20 minutes',
    grammar: '20-25 minutes',
    reading: '15-20 minutes',
    listening: '10-15 minutes',
    speaking: '15-20 minutes',
    writing: '20-25 minutes',
    review: '25-30 minutes'
  };
  
  return timeEstimates[focus] || '15-20 minutes';
}

/**
 * Get all daily plans for a week
 * @param {number} weekNumber - Week number
 * @returns {Array} Array of daily plans
 */
export async function getWeekPlans(weekNumber) {
  const plans = [];
  for (let day = 1; day <= 7; day++) {
    const plan = await generateDailyPlan(weekNumber, day);
    plans.push(plan);
  }
  return plans;
}

/**
 * Calculate progress percentage
 * @param {Date} startDate - User's start date
 * @returns {Object} Progress information
 */
export function calculateProgress(startDate) {
  const now = new Date();
  const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  
  const totalDays = 84; // 12 weeks * 7 days
  const percentage = Math.min((daysSinceStart / totalDays) * 100, 100);
  
  return {
    weekNumber: Math.floor(daysSinceStart / 7) + 1,
    dayNumber: (daysSinceStart % 7) + 1,
    totalDays: daysSinceStart + 1,
    percentage: Math.round(percentage),
    completed: daysSinceStart >= totalDays
  };
}
