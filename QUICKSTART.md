# 🚀 Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Create a `.env` file:

```bash
cp env.example .env
```

Edit `.env` and add your keys:

```env
TELEGRAM_BOT_TOKEN=8364765324:AAFdoxmyU2uvQyid_awoItuOVUrBPEhXDqA
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Optional: MySQL (bot works without it)
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_USER=root
# MYSQL_PASSWORD=password
# MYSQL_DATABASE=imparo_italiano
```

## 3. Start the Bot

```bash
npm start
```

You should see:
```
✅ Environment variables loaded successfully
✅ Database tables created/verified (if MySQL configured)
📅 Initializing scheduler...
⏰ Starting scheduled jobs...
✅ All scheduled jobs started!
🤖 Imparo Italiano Bot is running...
```

## 4. Test the Bot

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Send `/today` to get your first lesson

## 📅 Scheduled Messages

The bot will automatically send:
- **08:00 UTC** - Morning vocabulary
- **20:00 UTC** - Evening story  
- **21:00 UTC** - Practice exercises
- **Sunday 19:00 UTC** - Weekly quiz

## 🧪 Testing Without Waiting

Use commands to test immediately:
- `/vocab` - Get vocabulary now
- `/today` - Get today's lesson
- `/quiz` - Get a quiz now

## ⚠️ Important Notes

1. **Without MySQL**: Bot runs in demo mode (no persistence)
2. **Time zones**: All times are UTC by default
3. **Costs**: Monitor OpenAI API usage
4. **Testing**: Use `/today` command to test content generation

## 🐛 Common Issues

**"OpenAI API not configured"**
- Check `OPENAI_API_KEY` in `.env`
- Ensure no extra spaces or newlines

**"Database connection error"**
- Bot still works without MySQL
- Check MySQL credentials if you want persistence

**Bot not responding**
- Check bot is running
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Look at console for errors

## 📱 First Steps in Telegram

1. `/start` - Begin your journey
2. `/status` - See your progress (Week 1, Day 1)
3. `/today` - Get Day 1 vocabulary
4. `/week` - See the full week plan
5. Chat naturally - Ask questions anytime!

## 🎯 Daily Routine (Recommended)

- **Morning**: Check vocabulary message (08:00 UTC)
- **Study**: Review and practice words
- **Evening**: Read the story (20:00 UTC)
- **Practice**: Complete exercises (21:00 UTC)
- **Sunday**: Take the weekly quiz

---

**Ready to learn Italian? Type `/start` in your Telegram bot!** 🇮🇹

