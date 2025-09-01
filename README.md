# Jarvis - WhatsApp AI Bot using Baileys & Gemini AI

Jarvis is an intelligent WhatsApp bot powered by Google's Gemini AI, inspired by Tony Stark's AI assistant from Iron Man.

## Features
- 🤖 Powered by Google Gemini AI for intelligent responses
- 💬 Responds to any message with AI-generated replies
- 🎭 Jarvis personality - sophisticated, witty, and helpful
- 🔄 Automatic reconnection on disconnection
- 📱 QR code authentication
- ⚡ Real-time typing indicators
- 🧠 Context-aware conversations
- 💾 **User Memory System** - Remembers users and conversations
- 📝 **Personal Notes** - Stores user preferences and information
- 🎯 **Smart Context** - Uses conversation history for better responses

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. API Key Configuration
Your Gemini AI API key is already configured in `config.js`. If you need to change it:
- Edit `config.js` and update the `GEMINI_API_KEY` value
- Or create a `.env` file with `GEMINI_API_KEY=your_new_key_here`

### 3. Run Jarvis
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 4. Authentication
1. When you run Jarvis for the first time, a QR code will appear in your terminal
2. Scan this QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices
   - Tap "Link a Device"
   - Scan the QR code displayed in your terminal

### 5. Testing Jarvis
Once connected:
1. Send any message to your WhatsApp number from another account
2. Jarvis will respond using Gemini AI with his characteristic personality
3. Try messages like:
   - "Hello Jarvis"
   - "What can you do?"
   - "Tell me a joke"
   - "Help me with programming"

### 6. Memory Commands
Jarvis can remember information about you:
- **Set your name:** "My name is John" or "Jarvis my name is John"
- **Remember something:** "Remember I work at Google" or "Jarvis remember I love pizza"
- **Set preferences:** "I like programming" or "Jarvis I like coffee"
- **Check memory:** "What do you know about me?"
- **Clear memory:** "Jarvis forget me" (clears all your data)

## How Jarvis Works
- Uses Baileys library to connect to WhatsApp Web
- Integrates Google Gemini AI for intelligent responses
- Maintains Jarvis personality from Iron Man movies
- Shows typing indicators for realistic chat experience
- Handles errors gracefully with fallback responses

## Files Structure
- `bot.js` - Main bot logic and WhatsApp integration
- `gemini.js` - Gemini AI integration and response generation
- `storage.js` - User memory and conversation storage system
- `config.js` - Configuration including API key and bot settings
- `package.json` - Project dependencies and scripts
- `auth_info/` - WhatsApp authentication data (auto-generated)
- `user_data/` - User profiles and conversation history (auto-generated)

## Jarvis Personality
Jarvis responds with:
- Sophisticated and intelligent tone
- Helpful and witty responses
- Iron Man movie references when appropriate
- Professional yet friendly demeanor
- Concise responses suitable for WhatsApp

## API Key Security
- Your API key is stored in `config.js`
- For better security, you can use a `.env` file
- Never share your API key publicly
- The `auth_info` folder contains your WhatsApp session data

## Troubleshooting
- If Jarvis can't connect to Gemini AI, check your API key
- Make sure you have a stable internet connection
- Keep the bot running to respond to messages
- Check console for detailed logs and error messages

## Notes
- Jarvis needs to stay running to respond to messages
- Responses are limited to 2000 characters for WhatsApp compatibility
- The bot automatically reconnects if disconnected
- First-time setup requires QR code scanning

---
*"Sometimes you gotta run before you can walk." - Tony Stark*