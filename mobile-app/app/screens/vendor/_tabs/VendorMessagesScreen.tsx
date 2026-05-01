import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Search, Trash2 } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { getUserChats, deleteChatHistory, ChatOverview } from '@/app/_utils/messagesApi';
import { useSocket } from '@/app/_context/SocketContext';
import { router, useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';

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
        console.log(`Auto-purging ${corruptedChats.length} corrupted chats...`);
        for (const badChat of corruptedChats) {
          try {
            await deleteChatHistory(badChat.chatId);
          } catch (e) {
            console.warn('Failed to purge chat', badChat.chatId);
          }
        }
        // Refetch after purging
        const freshData = await getUserChats();
        setChats(freshData);
      } else {
        setChats(data);
      }
    } catch (error) {
      console.error('Failed to fetch vendor chats:', error);
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

    socket.on('receiveMessage', (message) => {
      fetchChats(); // Refresh list on new message
    });

    socket.on('newMessageNotification', (message) => {
      fetchChats();
    });

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
      'Delete Chat',
      `Delete conversation with ${clientName}?`,
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
        className="flex-row items-center px-5 py-4 bg-white border-b border-gray-100 active:bg-gray-50"
      >
        <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-primary font-bold text-lg">
            {item.otherUser.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {item.otherUser.name}
            </Text>
            <Text className="text-xs text-gray-500">{time}</Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-500 flex-1 mr-2" numberOfLines={1}>
              {lastMessage.text}
            </Text>
            {item.unreadCount > 0 && (
              <View className="bg-primary rounded-full px-2 py-0.5 min-w-[20px] items-center mr-2">
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
              <Trash2 size={18} color={Colors.error} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      <View className="bg-white px-5 py-5 border-b border-gray-100">
        <Text className="text-2xl font-bold" style={{ color: Colors.textPrimary }}>
          Messages
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Chat with your clients
        </Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.chatId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        contentContainerStyle={chats.length === 0 ? { flex: 1 } : {}}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center px-5">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <MessageCircle size={32} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                No Messages Yet
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                When customers message you about orders,{'\n'}they will appear here
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
