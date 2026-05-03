import { apiFetchJson } from './apiClient';
import { MESSAGE_ENDPOINTS } from '../_constants/apiEndpoints';

export type Message = {
  _id: string;
  chatId: string;
  senderId: { _id: string; name: string; email: string };
  receiverId: { _id: string; name: string; email: string };
  text: string;
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
    return response || [];
  } catch (error) {
    console.warn('Failed to load user chats:', error);
    return [];
  }
};

export const getChatHistory = async (chatId: string): Promise<Message[]> => {
  const url = MESSAGE_ENDPOINTS.chatHistory(chatId);
  try {
    const response = await apiFetchJson<Message[]>(url, { method: 'GET', auth: true });
    return response || [];
  } catch (error) {
    console.warn('Failed to load chat history:', error);
    return [];
  }
};

export const sendMessage = async (
  chatId: string,
  receiverId: string,
  text: string,
  bookingId?: string
): Promise<Message> => {
  const url = MESSAGE_ENDPOINTS.sendMessage;
  const response = await apiFetchJson<Message>(url, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ chatId, receiverId, text, bookingId }),
  });
  return response;
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

