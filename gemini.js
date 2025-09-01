import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './config.js';

class GeminiAI {
    constructor() {
        if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.error('⚠️ GEMINI_API_KEY not set! Please add your API key to config.js');
            console.log('Get your API key from: https://makersuite.google.com/app/apikey');
            this.isConfigured = false;
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ 
                model: config.GEMINI_MODEL,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 1000,
                }
            });
            this.isConfigured = true;
            console.log('✅ Gemini AI initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Gemini AI:', error.message);
            this.isConfigured = false;
        }
    }

    async generateResponse(userMessage, senderName = 'User', userContext = '') {
        if (!this.isConfigured) {
            return `Hey! I'm Jarvis, but my AI brain isn't set up properly yet. The admin needs to configure my API key first.`;
        }

        try {
            // Create context-aware prompt with Jarvis personality and user memory
            let prompt = `${config.SYSTEM_PROMPT}

${userContext ? `CONTEXT ABOUT USER:\n${userContext}\n` : ''}
User (${senderName}): ${userMessage}

Jarvis:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Limit response length for WhatsApp
            if (text.length > config.MAX_RESPONSE_LENGTH) {
                text = text.substring(0, config.MAX_RESPONSE_LENGTH - 3) + '...';
            }

            return text;
        } catch (error) {
            console.error('Error generating Gemini response:', error);
            
            // Fallback responses with casual Jarvis personality
            const fallbackResponses = [
                "Sorry, I'm having some tech issues right now. Give me a moment!",
                "Oops, something went wrong on my end. Try again in a bit?",
                "I'm having connection problems. Please try your message again!",
                "My AI brain is taking a quick break. Back in a sec!"
            ];
            
            return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }
    }

    // Method to update system prompt if needed
    updateSystemPrompt(newPrompt) {
        config.SYSTEM_PROMPT = newPrompt;
    }

    // Method to check if Gemini is properly configured
    isReady() {
        return this.isConfigured;
    }
}

export default GeminiAI;
