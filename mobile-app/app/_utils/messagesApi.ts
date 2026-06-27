import { apiFetchJson } from './apiClient';
import { MESSAGE_ENDPOINTS } from '../_constants/apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Message = {
  _id: string;
  chatId: string;
  senderId: { _id: string; name: string; email: string };
  receiverId: { _id: string; name: string; email: string };
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  isSending?: boolean;
  isRead: boolean;
  createdAt: string;
};

export type ChatOverview = {
  chatId: string;
  lastMessage: Message;
  unreadCount: number;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
};

export const getUserChats = async (): Promise<ChatOverview[]> => {
  const url = MESSAGE_ENDPOINTS.userChats;
  try {
    const response = await apiFetchJson<ChatOverview[]>(url, { method: 'GET', auth: true });
    const data = response || [];
    if (data.length > 0) {
      await AsyncStorage.setItem('cached_user_chats', JSON.stringify(data));
    }
    return data;
  } catch (error) {
    console.warn('Failed to load user chats, loading cache:', error);
    try {
      const cached = await AsyncStorage.getItem('cached_user_chats');
      if (cached) return JSON.parse(cached);
    } catch (cacheError) {
      console.error('Failed to read user chats cache:', cacheError);
    }
    return [];
  }
};

export const getChatHistory = async (chatId: string): Promise<Message[]> => {
  const url = MESSAGE_ENDPOINTS.chatHistory(chatId);
  try {
    const response = await apiFetchJson<Message[]>(url, { method: 'GET', auth: true });
    const data = response || [];
    if (data.length > 0) {
      await AsyncStorage.setItem(`cached_chat_history_${chatId}`, JSON.stringify(data));
    }
    return data;
  } catch (error) {
    console.warn(`Failed to load chat history for ${chatId}, loading cache:`, error);
    try {
      const cached = await AsyncStorage.getItem(`cached_chat_history_${chatId}`);
      if (cached) return JSON.parse(cached);
    } catch (cacheError) {
      console.error('Failed to read chat history cache:', cacheError);
    }
    return [];
  }
};

export const sendMessage = async (
  chatId: string,
  receiverId: string,
  text: string,
  bookingId?: string,
  imageUrl?: string,
  imageUri?: string,
  audioUri?: string
): Promise<Message> => {
  const url = MESSAGE_ENDPOINTS.sendMessage;
  try {
    const hasLocalFile = Boolean(imageUri || audioUri);
    const body = hasLocalFile
      ? (() => {
          const formData = new FormData();
          formData.append('chatId', chatId);
          formData.append('receiverId', receiverId);
          if (text) formData.append('text', text);
          if (bookingId) formData.append('bookingId', bookingId);
          if (imageUrl) formData.append('imageUrl', imageUrl);

          if (imageUri) {
            const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
            formData.append('image', { uri: imageUri, type, name: filename } as any);
          } else if (audioUri) {
            const filename = audioUri.split('/').pop() || `audio_${Date.now()}.m4a`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `audio/${match[1].toLowerCase()}` : 'audio/m4a';
            formData.append('image', { uri: audioUri, type, name: filename } as any);
          }
          return formData;
        })()
      : JSON.stringify({ chatId, receiverId, text, bookingId, imageUrl });

    const response = await apiFetchJson<Message>(url, {
      method: 'POST',
      auth: true,
      body,
    });
    
    // Validate response structure
    if (!response || typeof response !== 'object') {
      console.error('Invalid message response structure:', response);
      throw new Error('Server returned an invalid message format');
    }
    
    if (!response._id || !response.senderId || !response.receiverId) {
      console.error('Message missing required fields:', response);
      throw new Error('Server message missing required fields (_id, senderId, receiverId)');
    }
    
    const saved = {
      ...response,
      imageUrl: response.imageUrl || (response as any).image || (response as any).image_url || imageUrl || '',
      audioUrl: response.audioUrl || (response as any).audio || (response as any).audio_url || '',
    };
    
    try {
      const cachedStr = await AsyncStorage.getItem(`cached_chat_history_${chatId}`);
      let cached: Message[] = cachedStr ? JSON.parse(cachedStr) : [];
      cached = [...cached.filter((m) => m._id !== saved._id), saved];
      await AsyncStorage.setItem(`cached_chat_history_${chatId}`, JSON.stringify(cached));
    } catch (e) {
      console.warn('Failed to update chat history cache for sent message:', e);
    }

    return saved;
  } catch (error) {
    console.error('sendMessage API error:', error);
    throw error;
  }
};

export const markChatAsRead = async (chatId: string): Promise<any> => {
  const url = MESSAGE_ENDPOINTS.markChatAsRead(chatId);
  return apiFetchJson<any>(url, { method: 'PATCH', auth: true });
};

export const deleteChatHistory = async (chatId: string): Promise<any> => {
  const url = MESSAGE_ENDPOINTS.chatHistory(chatId);
  try {
    const response = await apiFetchJson<any>(url, { method: 'DELETE', auth: true });
    return response;
  } catch (error) {
    console.warn('Failed to delete chat history:', error);
    throw error;
  }
};

export default function MessagesApiStub() {
  return null;
}

