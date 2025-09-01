import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import GeminiAI from './gemini.js';
import UserStorage from './storage.js';
import config from './config.js';

async function startBot() {
    // Initialize Gemini AI and User Storage
    const geminiAI = new GeminiAI();
    const userStorage = new UserStorage();
    
    // Use multi-file auth state to store authentication
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('QR Code generated, please scan with your WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🤖 Jarvis WhatsApp Bot connected successfully! 🚀');
            console.log('🔥 Jarvis is online and ready to assist!');
            if (geminiAI.isReady()) {
                console.log('🧠 Gemini AI is operational - Jarvis is fully powered!');
            } else {
                console.log('⚠️ Gemini AI not configured - Jarvis running in basic mode');
            }
            console.log('💾 User memory system active - Jarvis will remember conversations!');
        }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        
        if (!message.message || message.key.fromMe) return;
        
        const messageContent = message.message.conversation || 
                              message.message.extendedTextMessage?.text || '';
        
        const senderNumber = message.key.remoteJid;
        const senderName = message.pushName || senderNumber.split('@')[0];
        
        // Skip empty messages
        if (!messageContent.trim()) return;
        
        console.log(`📨 Received message: "${messageContent}" from ${senderName} (${senderNumber})`);
        
        try {
            // Send typing indicator
            await sock.sendPresenceUpdate('composing', senderNumber);
            
            // Check for memory management commands
            if (await handleMemoryCommands(messageContent, senderNumber, senderName, userStorage, sock)) {
                return;
            }
            
            // Get user context from storage
            const userContext = await userStorage.getContextSummary(senderNumber);
            
            // Generate response using Gemini AI with user context
            const response = await geminiAI.generateResponse(messageContent, senderName, userContext);
            
            // Save conversation to storage
            await userStorage.saveConversation(senderNumber, messageContent, response);
            
            // Send the response
            await sock.sendMessage(senderNumber, { text: response });
            
            // Send "available" presence after sending message
            await sock.sendPresenceUpdate('available', senderNumber);
            
            console.log(`🤖 Jarvis replied to ${senderName}: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);
            
        } catch (error) {
            console.error('❌ Error processing message:', error);
            
            // Send error response with Jarvis personality
            try {
                await sock.sendMessage(senderNumber, { 
                    text: "Sorry, I'm having some technical issues right now. Please try again in a moment!" 
                });
            } catch (sendError) {
                console.error('❌ Error sending error message:', sendError);
            }
        }
    });

    return sock;
}

// Start the bot
startBot().catch(err => {
    console.error('Error starting bot:', err);
});

// Memory management commands handler
async function handleMemoryCommands(messageContent, senderNumber, senderName, userStorage, sock) {
    const lowerMessage = messageContent.toLowerCase().trim();
    
    // Set name command
    if (lowerMessage.startsWith('jarvis my name is ') || lowerMessage.startsWith('my name is ')) {
        const nameMatch = messageContent.match(/(?:jarvis )?my name is (.+)/i);
        if (nameMatch) {
            const name = nameMatch[1].trim();
            await userStorage.saveUserProfile(senderNumber, { name });
            await sock.sendMessage(senderNumber, { 
                text: `Got it! I'll remember your name is ${name}. Nice to meet you!` 
            });
            return true;
        }
    }
    
    // Remember something command
    if (lowerMessage.startsWith('jarvis remember ') || lowerMessage.startsWith('remember ')) {
        const rememberMatch = messageContent.match(/(?:jarvis )?remember (.+)/i);
        if (rememberMatch) {
            const note = rememberMatch[1].trim();
            await userStorage.addUserNote(senderNumber, note);
            await sock.sendMessage(senderNumber, { 
                text: `Noted! I'll remember: "${note}"` 
            });
            return true;
        }
    }
    
    // Set preference command
    if (lowerMessage.startsWith('jarvis i like ') || lowerMessage.startsWith('i like ')) {
        const likeMatch = messageContent.match(/(?:jarvis )?i like (.+)/i);
        if (likeMatch) {
            const preference = likeMatch[1].trim();
            await userStorage.setUserPreference(senderNumber, 'likes', preference);
            await sock.sendMessage(senderNumber, { 
                text: `Cool! I'll remember you like ${preference}.` 
            });
            return true;
        }
    }
    
    // Forget me command
    if (lowerMessage === 'jarvis forget me' || lowerMessage === 'forget me') {
        await userStorage.clearUserData(senderNumber);
        await sock.sendMessage(senderNumber, { 
            text: `Done! I've cleared all your data. Starting fresh now.` 
        });
        return true;
    }
    
    // What is my name command
    if (lowerMessage.includes('mera name kia hay') || lowerMessage.includes('what is my name') || 
        lowerMessage.includes('mera naam kya hai') || lowerMessage.includes('my name kya hai')) {
        const userProfile = await userStorage.getUserProfile(senderNumber);
        if (userProfile.name) {
            await sock.sendMessage(senderNumber, { 
                text: `Your name is ${userProfile.name}!` 
            });
        } else {
            await sock.sendMessage(senderNumber, { 
                text: `I don't know your name yet. Just say "My name is [your name]" and I'll remember it!` 
            });
        }
        return true;
    }
    
    // What do you know about me command
    if (lowerMessage.includes('what do you know about me') || lowerMessage.includes('what you know about me')) {
        const userProfile = await userStorage.getUserProfile(senderNumber);
        let info = "Here's what I know about you:\n\n";
        
        if (userProfile.name) {
            info += `• Name: ${userProfile.name}\n`;
        }
        
        if (userProfile.notes && userProfile.notes.length > 0) {
            info += `• Notes: ${userProfile.notes.slice(-3).map(n => n.note).join(', ')}\n`;
        }
        
        if (userProfile.preferences && Object.keys(userProfile.preferences).length > 0) {
            info += `• Preferences: ${JSON.stringify(userProfile.preferences)}\n`;
        }
        
        info += `• Messages exchanged: ${userProfile.messageCount || 0}\n`;
        info += `• First contact: ${new Date(userProfile.firstContact).toLocaleDateString()}\n`;
        
        if (Object.keys(userProfile).length <= 4) {
            info = "I don't know much about you yet! You can tell me:\n• My name is [name]\n• Remember [something]\n• I like [something]";
        }
        
        await sock.sendMessage(senderNumber, { text: info });
        return true;
    }
    
    return false;
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log('\n🤖 Jarvis is going offline. Goodbye!');
    process.exit(0);
});
