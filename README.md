# 🇮🇹 Imparo Italiano - Italian Learning Telegram Bot

A powerful Telegram bot powered by ChatGPT (OpenAI) to help you learn Italian through natural conversation, translations, grammar explanations, and vocabulary building.

## ✨ Features

- **🗣️ Natural Conversation**: Practice Italian through real conversations with an AI tutor
- **📚 Translation**: Instant translations between English and Italian
- **✍️ Grammar Help**: Get detailed explanations of Italian grammar rules
- **📖 Vocabulary Building**: Learn new words and phrases by topic
- **🔧 Error Correction**: Get gentle corrections with explanations when you make mistakes
- **💬 Context-Aware**: Remembers your conversation history for better learning
- **🎯 Adaptive Learning**: Adjusts to your skill level

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Telegram account
- OpenAI API key
- Telegram Bot Token

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
   - Edit `.env` and add your tokens:
     ```
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
     OPENAI_API_KEY=your_openai_api_key_here
     ```

6. **Run the bot**
   ```bash
   npm start
   ```
   
   For development with auto-restart (Node.js v18+):
   ```bash
   npm run dev
   ```

## 📱 How to Use

### Available Commands

- `/start` - Show welcome message and bot introduction
- `/help` - Get detailed usage instructions
- `/translate <text>` - Translate text between English and Italian
- `/grammar <question>` - Ask about grammar rules
- `/vocab [topic]` - Learn vocabulary (optionally by topic)
- `/clear` - Reset conversation history and start fresh

### Example Usage

**Free Conversation:**
```
You: Ciao! Come stai?
Bot: Ciao! Sto bene, grazie! E tu, come stai? 😊
```

**Translation:**
```
You: /translate How are you doing today?
Bot: Italian: "Come stai oggi?"
Explanation: This is a friendly, informal way to ask...
```

**Grammar Help:**
```
You: /grammar When do I use essere vs stare?
Bot: Great question! In Italian, both "essere" and "stare"...
```

**Vocabulary:**
```
You: /vocab food
Bot: Here are 10 useful Italian food vocabulary words:
1. Il pane - bread
   Example: Il pane è fresco. (The bread is fresh.)
...
```

**Practice Writing:**
```
You: Io andare al negozio ieri
Bot: Good try! Let me help you correct this:
✅ Correct: "Sono andato al negozio ieri" or "Sono andata al negozio ieri"
Explanation: ...
```

## 🔧 Configuration

### Model Selection

By default, the bot uses `gpt-4o-mini` which is cost-effective and fast. You can change this in `bot.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // Change to 'gpt-4o' for better quality
  // ...
});
```

### Conversation History

The bot keeps the last 20 messages per user to maintain context while managing token usage. You can adjust this in the `addToHistory` function.

## 💡 Tips for Learning

1. **Don't be afraid to make mistakes** - The bot will correct you kindly
2. **Try to write in Italian as much as possible** - Immersion is key
3. **Ask for explanations** - Understanding grammar helps retention
4. **Use /vocab regularly** - Build your vocabulary systematically
5. **Practice daily** - Consistency is more important than length
6. **Mix conversation with commands** - Use both natural chat and specific commands

## 📊 Cost Considerations

This bot uses OpenAI's API which has usage costs:
- **gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens (very affordable)
- **gpt-4o**: Higher quality but more expensive

Monitor your usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## 🛠️ Troubleshooting

### Bot not responding
- Check if the bot process is running
- Verify your `TELEGRAM_BOT_TOKEN` is correct
- Check the console for error messages

### OpenAI API errors
- Verify your `OPENAI_API_KEY` is valid
- Check your OpenAI account has credits
- Ensure you haven't exceeded rate limits

### "Polling error"
- Your bot token might be used by another instance
- Stop all other instances of the bot
- Restart the bot

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys private
- The `.gitignore` file is configured to exclude `.env`
- Rotate your keys periodically

## 📝 Development

### Project Structure

```
ImparoItaliano/
├── bot.js              # Main bot logic
├── package.json        # Dependencies and scripts
├── env.example         # Environment template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

### Adding Features

The bot is designed to be easily extensible. To add new commands:

1. Add a new command handler using `bot.onText()`
2. Integrate with ChatGPT using `getChatGPTResponse()`
3. Update the `/help` command to document the new feature

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Suggestions and improvements are welcome! Feel free to fork and submit pull requests.

## 🎓 Learning Resources

- [Duolingo Italian](https://www.duolingo.com/course/it/en/Learn-Italian)
- [Italian Grammar Rules](https://www.thoughtco.com/italian-grammar-4133841)
- [Italian Vocabulary Lists](https://www.fluentu.com/blog/italian/italian-vocabulary/)

## 📧 Support

If you encounter any issues or have questions, please check the troubleshooting section or open an issue.

---

**Buona fortuna con il tuo italiano!** 🇮🇹✨ (Good luck with your Italian!)

