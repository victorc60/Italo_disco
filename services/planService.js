import fs from 'fs/promises';
import path from 'path';

/**
 * Plan Service - Manages daily learning plans and curriculum structure
 * Generates 1-7 day plans with different learning activities
 */

// Improved daily learning activities - Integrated approach (vocab + grammar together)
const DAILY_ACTIVITIES = {
  1: { 
    focus: 'introduction', 
    task: 'Learn 8-10 new words + basic grammar in context',
    morning: 'vocabulary_grammar',
    afternoon: 'practice',
    evening: 'application'
  },
  2: { 
    focus: 'integration', 
    task: 'Review yesterday + 8-10 new words + grammar expansion',
    morning: 'review_learn',
    afternoon: 'integration',
    evening: 'production'
  },
  3: { 
    focus: 'expansion', 
    task: 'Review previous days + expand vocabulary and grammar',
    morning: 'review_learn',
    afternoon: 'reading',
    evening: 'writing'
  },
  4: { 
    focus: 'practice', 
    task: 'Review all previous content + listening practice',
    morning: 'review',
    afternoon: 'listening',
    evening: 'speaking'
  },
  5: { 
    focus: 'application', 
    task: 'Apply all learned content in conversations',
    morning: 'review',
    afternoon: 'conversation',
    evening: 'assessment'
  },
  6: { 
    focus: 'mastery', 
    task: 'Master difficult items + free practice',
    morning: 'difficult_review',
    afternoon: 'free_practice',
    evening: 'journal'
  },
  7: { 
    focus: 'consolidation', 
    task: 'Comprehensive review and assessment',
    morning: 'quiz',
    afternoon: 'error_review',
    evening: 'preview'
  }
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
    
    // Generate the complete daily plan with improved structure
    const dailyPlan = {
      weekNumber,
      dayNumber,
      theme: weekData.theme,
      focus: dailyActivity.focus,
      task: dailyActivity.task,
      morning: dailyActivity.morning,
      afternoon: dailyActivity.afternoon,
      evening: dailyActivity.evening,
      description: generateTaskDescription(weekData.theme, dailyActivity, weekNumber),
      exercises: generateExercises(weekData.theme, dailyActivity.focus, dayNumber),
      estimatedTime: getEstimatedTime(dailyActivity.focus),
      vocabularyCount: getVocabularyCount(dayNumber), // 8-10 words instead of 20
      includesReview: dayNumber > 1, // Days 2-7 include review
      storyBased: true // All learning is story/context-based
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
function generateTaskDescription(theme, activity, weekNumber) {
  const descriptions = {
    introduction: `Day 1: Introduction to "${theme}"
🌅 Morning: Learn 8-10 essential words + basic grammar in a dialogue/story context
🌆 Afternoon: Practice using new words and grammar in simple sentences
🌙 Evening: Apply what you learned in your own sentences

Everything is connected and used together, not separately!`,
    
    integration: `Day 2: Integration and Expansion
🌅 Morning: Review yesterday's words + learn 8-10 new words + expand grammar
🌆 Afternoon: Integrate all words and grammar in meaningful sentences
🌙 Evening: Produce original sentences using everything learned

Building on what you know, not starting over!`,
    
    expansion: `Day 3: Expanding Your Knowledge
🌅 Morning: Review previous days + add 8-10 new words + new grammar patterns
🌆 Afternoon: Read dialogue/story using all learned vocabulary and grammar
🌙 Evening: Write using the new patterns and vocabulary

Seeing everything work together in context!`,
    
    practice: `Day 4: Practice Makes Perfect
🌅 Morning: Review all vocabulary from this week (spaced repetition)
🌆 Afternoon: Listen to Italian audio and practice comprehension
🌙 Evening: Practice pronunciation and speaking exercises

Hearing and saying what you've learned!`,
    
    application: `Day 5: Real Application
🌅 Morning: Review difficult items from the week
🌆 Afternoon: Have conversations using this week's content
🌙 Evening: Self-assessment quiz on this week's progress

Using Italian in real situations!`,
    
    mastery: `Day 6: Mastery and Freedom
🌅 Morning: Focus on difficult items that need extra practice
🌆 Afternoon: Free practice - use Italian however you want
🌙 Evening: Write a journal entry using this week's vocabulary

You're becoming fluent!`,
    
    consolidation: `Day 7: Week Consolidation
🌅 Morning: Comprehensive quiz on all week's content
🌆 Afternoon: Review mistakes and practice weak areas
🌙 Evening: Celebrate progress + preview next week's theme

You've completed another week! Bravissimo!`
  };
  
  return descriptions[activity.focus] || activity.task;
}

/**
 * Get vocabulary count based on day (8-10 words, not 20)
 * @param {number} dayNumber - Day number
 * @returns {number} Number of words to learn
 */
function getVocabularyCount(dayNumber) {
  if (dayNumber === 1) {
    return 10; // First day: 10 words
  } else if (dayNumber >= 2 && dayNumber <= 5) {
    return 8; // Days 2-5: 8 words (plus review)
  } else {
    return 0; // Days 6-7: Review only, no new words
  }
}

/**
 * Generate exercises for the daily activity (improved with active recall)
 * @param {string} theme - Week theme
 * @param {string} focus - Daily focus
 * @param {number} dayNumber - Day number for progressive difficulty
 * @returns {Array} Array of exercise objects
 */
function generateExercises(theme, focus, dayNumber) {
  const exerciseTemplates = {
    introduction: [
      { type: 'story_vocabulary', description: 'Learn 8-10 words in a dialogue/story context about ' + theme },
      { type: 'grammar_in_context', description: 'Learn grammar rule that uses these words immediately' },
      { type: 'active_recall', description: 'Recall words without looking (active, not passive)' },
      { type: 'simple_sentences', description: 'Create 3-5 simple sentences using new words + grammar' }
    ],
    integration: [
      { type: 'review_quiz', description: 'Quick review quiz on yesterday\'s words (spaced repetition)' },
      { type: 'new_words', description: 'Learn 8 new words that connect to yesterday\'s topic' },
      { type: 'grammar_expansion', description: 'Expand grammar knowledge with new patterns' },
      { type: 'integrated_practice', description: 'Use all words and grammar together in sentences' }
    ],
    expansion: [
      { type: 'review', description: 'Review words from Days 1-2 (active recall)' },
      { type: 'new_content', description: 'Add 8 more words + new grammar patterns' },
      { type: 'reading_comprehension', description: 'Read dialogue using ALL learned vocabulary' },
      { type: 'writing_practice', description: 'Write sentences using new patterns' }
    ],
    practice: [
      { type: 'spaced_review', description: 'Review all week\'s vocabulary (spaced repetition)' },
      { type: 'listening', description: 'Listen to audio dialogue using this week\'s vocabulary' },
      { type: 'pronunciation', description: 'Practice pronouncing all learned words' },
      { type: 'speaking', description: 'Record yourself speaking using this week\'s content' }
    ],
    application: [
      { type: 'difficult_review', description: 'Focus on words/grammar you find difficult' },
      { type: 'conversation', description: 'Have a conversation about ' + theme + ' using learned content' },
      { type: 'scenarios', description: 'Practice real-world scenarios (ordering, asking directions, etc.)' },
      { type: 'self_quiz', description: 'Test yourself on this week\'s progress' }
    ],
    mastery: [
      { type: 'weak_areas', description: 'Practice items you struggled with' },
      { type: 'free_practice', description: 'Use Italian freely - no restrictions!' },
      { type: 'creative_writing', description: 'Write creatively using all learned vocabulary' },
      { type: 'journal', description: 'Write a journal entry about ' + theme }
    ],
    consolidation: [
      { type: 'comprehensive_quiz', description: 'Quiz on all week\'s content' },
      { type: 'error_analysis', description: 'Review mistakes and understand why' },
      { type: 'weak_practice', description: 'Extra practice on weak areas' },
      { type: 'celebration', description: 'Celebrate your progress this week!' },
      { type: 'preview', description: 'Preview next week\'s exciting theme' }
    ]
  };
  
  return exerciseTemplates[focus] || [];
}

/**
 * Get estimated time for different activities (improved structure)
 * @param {string} focus - Activity focus
 * @returns {string} Estimated time
 */
function getEstimatedTime(focus) {
  const timeEstimates = {
    introduction: '25-30 minutes total (10 min morning, 10 min afternoon, 10 min evening)',
    integration: '25-30 minutes total (review + new content + practice)',
    expansion: '25-30 minutes total (review + expansion + application)',
    practice: '25-30 minutes total (review + listening + speaking)',
    application: '25-30 minutes total (review + conversation + assessment)',
    mastery: '20-25 minutes total (practice + free expression)',
    consolidation: '30-35 minutes total (quiz + review + preview)'
  };
  
  return timeEstimates[focus] || '25-30 minutes';
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
