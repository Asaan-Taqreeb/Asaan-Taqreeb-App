import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Trash2 } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { getUserChats, deleteChatHistory, ChatOverview } from '@/app/_utils/messagesApi';
import { useSocket } from '@/app/_context/SocketContext';
import { router, useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import Avatar from '@/app/_components/Avatar';

export default function VendorMessagesScreen() {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<ChatOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();

  const fetchChats = useCallback(async () => {
    try {
      const data = await getUserChats();
      
      // Auto-purge corrupted chats
      const corruptedChats = data.filter(chat => chat.otherUser._id === 'deleted');
      if (corruptedChats.length > 0) {
        for (const badChat of corruptedChats) {
          try {
            await deleteChatHistory(badChat.chatId);
          } catch (e) {
            // Quietly ignore purging errors
          }
        }
        const freshData = await getUserChats();
        setChats(freshData);
      } else {
        setChats(data);
      }
    } catch (error) {
      // Quietly ignore fetch errors
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  useEffect(() => {
    if (!socket) return;
    socket.on('receiveMessage', () => fetchChats());
    socket.on('newMessageNotification', () => fetchChats());
    return () => {
      socket.off('receiveMessage');
      socket.off('newMessageNotification');
    };
  }, [socket, fetchChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const handleDeleteChat = (chatId: string, clientName: string) => {
    Alert.alert(
      'Delete Conversation',
      `Delete all messages with ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatHistory(chatId);
              await fetchChats();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete chat');
            }
          }
        }
      ]
    );
  };

  const renderChatItem = ({ item }: { item: ChatOverview }) => {
    const lastMessage = item.lastMessage;
    const time = new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Pressable 
        onPress={() => router.push({
          pathname: '/screens/vendor/Component/ClientChatScreen',
          params: { 
            chatId: item.chatId, 
            clientId: item.otherUser._id, 
            clientName: item.otherUser.name 
          }
        })}
        className="flex-row items-center px-6 py-5 bg-white active:bg-gray-50"
        style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}
      >
        <Avatar name={item.otherUser.name} size="md" />
        
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-bold" style={{color: Colors.textPrimary}} numberOfLines={1}>
              {item.otherUser.name}
            </Text>
            <Text className="text-xs font-medium" style={{color: Colors.textTertiary}}>{time}</Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-medium flex-1 mr-2" style={{color: Colors.textSecondary}} numberOfLines={1}>
              {lastMessage.text}
            </Text>
            {item.unreadCount > 0 && (
              <View className="bg-primary rounded-full px-2 py-0.5 min-w-[20px] items-center mr-2" style={{backgroundColor: Colors.vendor}}>
                <Text className="text-[10px] text-white font-bold">{item.unreadCount}</Text>
              </View>
            )}
            
            <Pressable
              className='p-2 rounded-full active:opacity-70 ml-2'
              style={{backgroundColor: Colors.lightGray}}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteChat(item.chatId, item.otherUser.name);
              }}
            >
              <Trash2 size={16} color={Colors.error} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: Colors.background }}>
      <View className="bg-white px-6 py-6" style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <Text className="text-xl font-bold" style={{ color: Colors.textPrimary }}>
          Customer Chats
        </Text>
        <Text className="text-xs font-medium mt-0.5" style={{ color: Colors.textSecondary }}>
          {chats.length} active conversation{chats.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.chatId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.vendor} />
        }
        contentContainerStyle={chats.length === 0 ? { flex: 1 } : {}}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center px-10 py-20">
              <View className="w-20 h-20 rounded-2xl bg-gray-100 items-center justify-center mb-6">
                <MessageCircle size={32} color={Colors.textTertiary} />
              </View>
              <Text className="text-lg font-bold text-gray-900 mb-2">
                No Active Chats
              </Text>
              <Text className="text-sm font-medium text-gray-400 text-center">
                When customers message you about orders,{'\n'}they will appear here
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

