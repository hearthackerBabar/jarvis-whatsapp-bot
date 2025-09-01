import fs from 'fs-extra';
import path from 'path';

class UserStorage {
    constructor() {
        this.storageDir = path.join(process.cwd(), 'user_data');
        this.conversationsDir = path.join(this.storageDir, 'conversations');
        this.usersDir = path.join(this.storageDir, 'users');
        
        // Create directories if they don't exist
        this.initStorage();
    }

    async initStorage() {
        try {
            await fs.ensureDir(this.storageDir);
            await fs.ensureDir(this.conversationsDir);
            await fs.ensureDir(this.usersDir);
            console.log('💾 User storage initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing storage:', error);
        }
    }

    // Get safe filename from phone number
    getSafeFilename(phoneNumber) {
        return phoneNumber.replace(/[^a-zA-Z0-9]/g, '_');
    }

    // Store user profile data
    async saveUserProfile(phoneNumber, userData) {
        try {
            const filename = this.getSafeFilename(phoneNumber);
            const filePath = path.join(this.usersDir, `${filename}.json`);
            
            const existingData = await this.getUserProfile(phoneNumber);
            const updatedData = {
                ...existingData,
                ...userData,
                phoneNumber,
                lastUpdated: new Date().toISOString()
            };

            await fs.writeJson(filePath, updatedData, { spaces: 2 });
            console.log(`👤 Saved profile for ${userData.name || phoneNumber}`);
            return updatedData;
        } catch (error) {
            console.error('❌ Error saving user profile:', error);
            return null;
        }
    }

    // Get user profile data
    async getUserProfile(phoneNumber) {
        try {
            const filename = this.getSafeFilename(phoneNumber);
            const filePath = path.join(this.usersDir, `${filename}.json`);
            
            if (await fs.pathExists(filePath)) {
                return await fs.readJson(filePath);
            }
            
            // Return default profile if file doesn't exist
            return {
                phoneNumber,
                name: null,
                preferences: {},
                notes: [],
                firstContact: new Date().toISOString(),
                messageCount: 0
            };
        } catch (error) {
            console.error('❌ Error reading user profile:', error);
            return {
                phoneNumber,
                name: null,
                preferences: {},
                notes: [],
                firstContact: new Date().toISOString(),
                messageCount: 0
            };
        }
    }

    // Save conversation history
    async saveConversation(phoneNumber, userMessage, botResponse) {
        try {
            const filename = this.getSafeFilename(phoneNumber);
            const filePath = path.join(this.conversationsDir, `${filename}.json`);
            
            let conversations = [];
            if (await fs.pathExists(filePath)) {
                conversations = await fs.readJson(filePath);
            }

            const newEntry = {
                timestamp: new Date().toISOString(),
                userMessage,
                botResponse,
                messageId: Date.now()
            };

            conversations.push(newEntry);

            // Keep only last 50 conversations to prevent file from getting too large
            if (conversations.length > 50) {
                conversations = conversations.slice(-50);
            }

            await fs.writeJson(filePath, conversations, { spaces: 2 });
            
            // Update user message count
            const userProfile = await this.getUserProfile(phoneNumber);
            userProfile.messageCount = (userProfile.messageCount || 0) + 1;
            userProfile.lastMessage = new Date().toISOString();
            await this.saveUserProfile(phoneNumber, userProfile);

        } catch (error) {
            console.error('❌ Error saving conversation:', error);
        }
    }

    // Get recent conversation history
    async getRecentConversations(phoneNumber, limit = 5) {
        try {
            const filename = this.getSafeFilename(phoneNumber);
            const filePath = path.join(this.conversationsDir, `${filename}.json`);
            
            if (await fs.pathExists(filePath)) {
                const conversations = await fs.readJson(filePath);
                return conversations.slice(-limit);
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error reading conversations:', error);
            return [];
        }
    }

    // Add a note about the user
    async addUserNote(phoneNumber, note) {
        try {
            const userProfile = await this.getUserProfile(phoneNumber);
            
            if (!userProfile.notes) {
                userProfile.notes = [];
            }

            userProfile.notes.push({
                note,
                timestamp: new Date().toISOString()
            });

            // Keep only last 20 notes
            if (userProfile.notes.length > 20) {
                userProfile.notes = userProfile.notes.slice(-20);
            }

            await this.saveUserProfile(phoneNumber, userProfile);
            return true;
        } catch (error) {
            console.error('❌ Error adding user note:', error);
            return false;
        }
    }

    // Set user preference
    async setUserPreference(phoneNumber, key, value) {
        try {
            const userProfile = await this.getUserProfile(phoneNumber);
            
            if (!userProfile.preferences) {
                userProfile.preferences = {};
            }

            userProfile.preferences[key] = value;
            await this.saveUserProfile(phoneNumber, userProfile);
            return true;
        } catch (error) {
            console.error('❌ Error setting user preference:', error);
            return false;
        }
    }

    // Get context summary for AI
    async getContextSummary(phoneNumber) {
        try {
            const userProfile = await this.getUserProfile(phoneNumber);
            const recentChats = await this.getRecentConversations(phoneNumber, 3);
            
            let context = '';
            
            // Add user info
            if (userProfile.name) {
                context += `User's name: ${userProfile.name}\n`;
            }
            
            // Add user notes
            if (userProfile.notes && userProfile.notes.length > 0) {
                const recentNotes = userProfile.notes.slice(-3);
                context += `Important notes about user: ${recentNotes.map(n => n.note).join(', ')}\n`;
            }
            
            // Add preferences
            if (userProfile.preferences && Object.keys(userProfile.preferences).length > 0) {
                context += `User preferences: ${JSON.stringify(userProfile.preferences)}\n`;
            }
            
            // Add recent conversation context
            if (recentChats.length > 0) {
                context += `Recent conversation:\n`;
                recentChats.forEach(chat => {
                    context += `User: ${chat.userMessage}\nJarvis: ${chat.botResponse}\n`;
                });
            }
            
            // Add message count
            context += `Total messages exchanged: ${userProfile.messageCount || 0}\n`;
            
            return context.trim();
        } catch (error) {
            console.error('❌ Error getting context summary:', error);
            return '';
        }
    }

    // Clear user data (for privacy)
    async clearUserData(phoneNumber) {
        try {
            const filename = this.getSafeFilename(phoneNumber);
            const userFile = path.join(this.usersDir, `${filename}.json`);
            const conversationFile = path.join(this.conversationsDir, `${filename}.json`);
            
            if (await fs.pathExists(userFile)) {
                await fs.remove(userFile);
            }
            
            if (await fs.pathExists(conversationFile)) {
                await fs.remove(conversationFile);
            }
            
            console.log(`🗑️ Cleared all data for ${phoneNumber}`);
            return true;
        } catch (error) {
            console.error('❌ Error clearing user data:', error);
            return false;
        }
    }
}

export default UserStorage;
