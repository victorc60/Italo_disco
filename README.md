# 🇮🇹 Imparo Italiano - Structured Italian Learning Bot

A comprehensive Telegram bot powered by ChatGPT (OpenAI) that teaches Italian through a **structured 12-week curriculum** with automated daily lessons, stories, practice exercises, and weekly quizzes.

## ✨ Features

### 📚 **Structured Learning**
- **12-week comprehensive curriculum** covering essential Italian topics
- Daily lessons automatically delivered at scheduled times
- Progressive learning from greetings to complex conversations
- Integrated vocabulary, grammar, reading, writing, and practice

### ⏰ **Automated Daily Schedule**
- **08:00 UTC** - Morning vocabulary (5 new words daily)
- **20:00 UTC** - Evening story using learned vocabulary
- **21:00 UTC** - Practice exercises and sentence building
- **Sunday 19:00 UTC** - Weekly quiz to test knowledge

### 🤖 **AI-Powered Content**
- Dynamic content generation using GPT-4o-mini
- Personalized based on weekly themes from `plan.json`
- Context-aware conversations and corrections
- Adaptive difficulty based on progress

### 💾 **Progress Tracking** (Optional MySQL)
- Track user progress through the curriculum
- Store learned vocabulary for each week
- Quiz results and performance tracking
- Works with or without database

## 📖 12-Week Curriculum

The bot follows a structured plan defined in `plan.json`:

| Week | Theme | Focus Areas |
|------|-------|-------------|
| 1 | Greetings and Basic Phrases | Essere, avere, introductions |
| 2 | Numbers and Dates | Counting, dates, prices |
| 3 | Family and Relationships | Possessive adjectives |
| 4 | Daily Routine | Regular -are verbs |
| 5 | Food and Drinks | Articles with nouns |
| 6 | At Home and Furniture | Prepositions of place |
| 7 | Clothes and Shopping | Adjectives |
| 8 | Weather and Seasons | Weather expressions |
| 9 | Travel and Transportation | Transport prepositions |
| 10 | Health and Body | Reflexive verbs |
| 11 | Free Time and Hobbies | Using 'piacere' |
| 12 | Emotions and Communication | Expressing feelings |

Each week includes:
- **Day 1**: Vocabulary (25 words)
- **Day 2**: Grammar focus
- **Day 3**: Reading comprehension
- **Day 4**: Practice exercises
- **Day 5**: Writing tasks
- **Day 6**: Revision
- **Day 7**: Weekly quiz

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- Telegram account
- OpenAI API key
- MySQL database (optional, bot works without it)

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Telegram Bot**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` and follow the instructions
   - Copy the bot token you receive

4. **Get your OpenAI API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account or sign in
   - Generate a new API key
   - Copy the API key

5. **Configure environment variables**
   - Copy `env.example` to `.env`:
     ```bash
     cp env.example .env
     ```
   - Edit `.env` and add your keys:
     ```env
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token
     OPENAI_API_KEY=your_openai_api_key
     
     # Optional: MySQL configuration
     MYSQL_HOST=your_mysql_host
     MYSQL_PORT=3306
     MYSQL_USER=your_user
     MYSQL_PASSWORD=your_password
     MYSQL_DATABASE=imparo_italiano
     ```

6. **Run the bot**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## 📱 Using the Bot

### Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Begin your Italian learning journey |
| `/status` | View your current progress and stats |
| `/today` | Get today's lesson based on your progress |
| `/week` | See the full week's learning plan |
| `/vocab` | Get vocabulary for current theme |
| `/quiz` | Take a practice quiz |
| `/help` | Show help and usage information |

### Example Usage

**Starting your journey:**
```
/start
→ Bot registers you and explains the 12-week program
```

**Checking progress:**
```
/status
→ Week 3 of 12 - Family and Relationships
→ Day 4 of 7
→ Today's Task: Write about your family
```

**Getting today's lesson:**
```
/today
→ Receives customized content based on current day's focus
```

**Free conversation:**
```
You: Come si dice "thank you" in italiano?
Bot: In Italian, "thank you" is "grazie" [detailed explanation]
```

## 🏗️ Project Structure

```
ImparoItaliano/
├── index.js              # Main bot entry point
├── plan.json            # 12-week curriculum definition
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables (not in git)
├── env.example          # Environment template
├── services/
│   ├── planService.js   # Reads and manages plan.json
│   ├── wordsService.js  # Generates vocabulary with GPT
│   ├── storyService.js  # Generates stories and practice
│   ├── quizService.js   # Generates and evaluates quizzes
│   ├── scheduler.js     # Cron jobs for automated tasks
│   └── db.js           # MySQL database operations
└── README.md           # This file
```

## 🔧 Configuration

### Scheduled Times

Edit times in `services/scheduler.js`:

```javascript
// Morning vocabulary - 8:00 AM UTC
cron.schedule('0 8 * * *', ...);

// Evening story - 8:00 PM UTC
cron.schedule('0 20 * * *', ...);

// Practice prompt - 9:00 PM UTC
cron.schedule('0 21 * * *', ...);

// Weekly quiz - Sunday 7:00 PM UTC
cron.schedule('0 19 * * 0', ...);
```

### Customizing the Curriculum

Edit `plan.json` to customize:
- Week themes
- Daily tasks
- Focus areas (vocabulary, grammar, reading, etc.)

### OpenAI Model

The bot uses `gpt-4o-mini` by default for cost-effectiveness. To use a different model, update in the service files:

```javascript
model: 'gpt-4o-mini', // Change to 'gpt-4o' for better quality
```

## 💾 Database (Optional)

The bot works with or without MySQL:

**Without Database:**
- Bot runs in "demo mode"
- No persistence of user progress
- All features work except progress tracking

**With Database:**
- User progress is tracked
- Vocabulary is stored per week
- Quiz results are saved
- Learning history is maintained

### Setting up MySQL

1. Create a MySQL database
2. Add credentials to `.env`
3. Bot will auto-create tables on first run

Tables created:
- `users` - User registration and progress
- `daily_progress` - Daily task completion
- `quiz_results` - Quiz scores
- `user_vocabulary` - Learned words

## 🚂 Deploying to Railway

### Environment Variables in Railway

1. Go to Railway dashboard
2. Select your project
3. Go to **Variables** tab
4. Add these variables:
   - `TELEGRAM_BOT_TOKEN`
   - `OPENAI_API_KEY`
   - `MYSQL_HOST` (if using Railway MySQL)
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### Railway MySQL Setup

1. Add MySQL plugin in Railway
2. Railway will auto-provide environment variables
3. Bot will connect automatically

### Deploy

```bash
# Push to GitHub
git add .
git commit -m "Italian learning bot"
git push

# Railway will auto-deploy from GitHub
```

## 📊 How It Works

### Daily Learning Flow

1. **Morning (08:00 UTC)**
   - User receives 5 vocabulary words
   - Words are themed based on current week
   - Includes translations and examples

2. **Evening (20:00 UTC)**
   - Short story using today's vocabulary
   - Comprehension questions included
   - Reinforces morning learning

3. **Night (21:00 UTC)**
   - Practice exercises on practice/writing days
   - User submits sentences
   - AI provides feedback and corrections

4. **Sunday (19:00 UTC)**
   - Weekly quiz covering all week's material
   - 5 multiple-choice questions
   - Immediate feedback with explanations

### Progress Tracking

The bot tracks user progress automatically:
- Calculates current week and day based on start date
- Delivers appropriate content for each day
- Advances through 12-week curriculum
- Notifies upon completion

## 💡 Advanced Features

### Plan Service Functions

```javascript
import * as planService from './services/planService.js';

// Get current task for a user
const task = await planService.getCurrentTask(userStartDate);

// Get specific week data
const week = await planService.getWeek(3);

// Get day task
const dayTask = await planService.getDayTask(3, 4);

// Calculate progress
const progress = planService.calculateProgress(startDate);
```

### Custom Content Generation

```javascript
import * as wordsService from './services/wordsService.js';

// Generate vocabulary
const words = await wordsService.generateDailyWords(
  'Family and Relationships',
  'Learn family member words',
  'vocabulary',
  5
);
```

## 🐛 Troubleshooting

### Bot not responding
- Check bot is running: `npm start`
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check console for errors

### No scheduled messages
- Verify times in `scheduler.js`
- Check timezone settings
- Ensure bot has been running continuously

### Database errors
- Check MySQL credentials in `.env`
- Verify database exists
- Bot works without MySQL in demo mode

### OpenAI API errors
- Verify `OPENAI_API_KEY` is valid
- Check API credits and limits
- Review error messages in console

## 💰 Cost Considerations

### OpenAI API Costs (gpt-4o-mini)
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- Estimated: $1-3 per user per month

### Railway Costs
- Starter plan: $5/month
- Includes compute and bandwidth
- MySQL addon: $5/month (optional)

## 🔒 Security

- ✅ `.env` is in `.gitignore` - never committed
- ✅ Environment variables encrypted in Railway
- ✅ API keys trimmed to prevent whitespace issues
- ✅ Input validation on user messages
- ✅ Error handling prevents crashes

## 📈 Future Enhancements

Potential additions:
- [ ] Voice message support (pronunciation)
- [ ] Image-based vocabulary learning
- [ ] Progress charts and statistics
- [ ] Certificate upon completion
- [ ] Multiple difficulty levels
- [ ] Conversation partner mode
- [ ] Cultural tips and facts

## 🤝 Contributing

Suggestions and improvements are welcome!

## 📄 License

MIT License - Free to use and modify

## 🎓 Learning Tips

1. **Follow the schedule** - Consistency is key
2. **Don't skip quizzes** - They reinforce learning
3. **Practice daily** - Even 10 minutes helps
4. **Use free conversation** - Ask questions anytime
5. **Review previous weeks** - Repetition aids retention

## 📧 Support

For issues:
1. Check the troubleshooting section
2. Review console error messages
3. Verify all environment variables are set
4. Test database connection

---

**Buona fortuna con il tuo italiano!** 🇮🇹✨

Made with ❤️ for Italian language learners
