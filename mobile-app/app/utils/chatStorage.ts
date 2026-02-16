import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'vendor' | 'ai';
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  type: 'ai' | 'vendor';
  name: string;
  category?: string;
  location?: string;
  lastMessage: string;
  lastMessageTime: Date;
  messages: Message[];
  unreadCount?: number;
}

const CHATS_STORAGE_KEY = '@asaan_taqreeb_chats';

// Get all chat conversations
export const getAllChats = async (): Promise<ChatConversation[]> => {
  try {
    const chatsJson = await AsyncStorage.getItem(CHATS_STORAGE_KEY);
    if (chatsJson) {
      const chats = JSON.parse(chatsJson);
      // Convert date strings back to Date objects
      return chats.map((chat: any) => ({
        ...chat,
        lastMessageTime: new Date(chat.lastMessageTime),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading chats:', error);
    return [];
  }
};

// Get a specific chat by ID
export const getChatById = async (chatId: string): Promise<ChatConversation | null> => {
  try {
    const chats = await getAllChats();
    return chats.find(chat => chat.id === chatId) || null;
  } catch (error) {
    console.error('Error loading chat:', error);
    return null;
  }
};

// Save or update a chat conversation
export const saveChat = async (chat: ChatConversation): Promise<void> => {
  try {
    const chats = await getAllChats();
    const existingIndex = chats.findIndex(c => c.id === chat.id);
    
    if (existingIndex >= 0) {
      // Update existing chat
      chats[existingIndex] = chat;
    } else {
      // Add new chat
      chats.unshift(chat);
    }
    
    await AsyncStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chat:', error);
  }
};

// Add a message to a chat
export const addMessageToChat = async (
  chatId: string,
  message: Message,
  chatInfo: {
    type: 'ai' | 'vendor';
    name: string;
    category?: string;
    location?: string;
  }
): Promise<void> => {
  try {
    let chat = await getChatById(chatId);
    
    if (!chat) {
      // Create new chat if it doesn't exist
      chat = {
        id: chatId,
        type: chatInfo.type,
        name: chatInfo.name,
        category: chatInfo.category,
        location: chatInfo.location,
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
        messages: [message],
        unreadCount: 0
      };
    } else {
      // Update existing chat
      chat.messages.push(message);
      chat.lastMessage = message.text;
      chat.lastMessageTime = message.timestamp;
    }
    
    await saveChat(chat);
  } catch (error) {
    console.error('Error adding message:', error);
  }
};

// Delete a specific chat
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    const chats = await getAllChats();
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    await AsyncStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(filteredChats));
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
};

// Clear all chats
export const clearAllChats = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CHATS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing chats:', error);
  }
};

// Get chat count
export const getChatCount = async (): Promise<number> => {
  try {
    const chats = await getAllChats();
    return chats.length;
  } catch (error) {
    console.error('Error getting chat count:', error);
    return 0;
  }
};
