import { apiFetchJson } from './apiClient';
import { MESSAGE_ENDPOINTS } from '../_constants/apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { triggerChatRefresh } from './chatEvents';

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
    await AsyncStorage.setItem('cached_user_chats', JSON.stringify(data));
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
    await AsyncStorage.setItem(`cached_chat_history_${chatId}`, JSON.stringify(data));
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
    let body: any = null;
    if (hasLocalFile) {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('receiverId', receiverId);
      if (text) formData.append('text', text);
      if (bookingId) formData.append('bookingId', bookingId);
      if (imageUrl) formData.append('imageUrl', imageUrl);

      if (imageUri) {
        const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
        if (Platform.OS === 'web') {
          try {
            const res = await fetch(imageUri);
            const blob = await res.blob();
            formData.append('image', blob, filename);
          } catch (e) {
            console.error('Failed to convert image URI to blob on web:', e);
            formData.append('image', { uri: imageUri, type: 'image/jpeg', name: filename } as any);
          }
        } else {
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
          formData.append('image', { uri: imageUri, type, name: filename } as any);
        }
      } else if (audioUri) {
        const filename = audioUri.split('/').pop() || `audio_${Date.now()}.m4a`;
        if (Platform.OS === 'web') {
          try {
            const res = await fetch(audioUri);
            const blob = await res.blob();
            formData.append('image', blob, filename);
          } catch (e) {
            console.error('Failed to convert audio URI to blob on web:', e);
            formData.append('image', { uri: audioUri, type: 'audio/m4a', name: filename } as any);
          }
        } else {
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `audio/${match[1].toLowerCase()}` : 'audio/m4a';
          formData.append('image', { uri: audioUri, type, name: filename } as any);
        }
      }
      body = formData;
    } else {
      body = JSON.stringify({ chatId, receiverId, text, bookingId, imageUrl });
    }

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
  try {
    const response = await apiFetchJson<any>(url, { method: 'PATCH', auth: true });
    
    // Immediately update the cached_user_chats to set unreadCount to 0 for this chatId
    try {
      const cached = await AsyncStorage.getItem('cached_user_chats');
      if (cached) {
        const chats: ChatOverview[] = JSON.parse(cached);
        const updated = chats.map(chat => 
          chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat
        );
        await AsyncStorage.setItem('cached_user_chats', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to update cached_user_chats after marking read:', e);
    }

    // Trigger count refresh statically
    triggerChatRefresh();

    return response;
  } catch (err) {
    console.warn('Failed to mark chat as read:', err);
    throw err;
  }
};

export const deleteChatHistory = async (chatId: string): Promise<any> => {
  const url = MESSAGE_ENDPOINTS.chatHistory(chatId);
  try {
    const response = await apiFetchJson<any>(url, { method: 'DELETE', auth: true });
    
    // Clear cache entries
    try {
      await AsyncStorage.removeItem(`cached_chat_history_${chatId}`);
      const cached = await AsyncStorage.getItem('cached_user_chats');
      if (cached) {
        const chats: ChatOverview[] = JSON.parse(cached);
        const updated = chats.filter(chat => chat.chatId !== chatId);
        await AsyncStorage.setItem('cached_user_chats', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to clear cached chat history after deletion:', e);
    }

    triggerChatRefresh();
    return response;
  } catch (error) {
    console.warn('Failed to delete chat history:', error);
    throw error;
  }
};

export default function MessagesApiStub() {
  return null;
}

