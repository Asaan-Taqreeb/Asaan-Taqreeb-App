import { ScrollView, StyleSheet, Text, View, Pressable, Alert, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
import { MessageCircle, Bot, Trash2, MapPin } from 'lucide-react-native'
import { Colors, getCategoryColor } from '@/app/_constants/theme'
import { getUserChats, deleteChatHistory, ChatOverview } from '@/app/_utils/messagesApi'
import { useSocket } from '@/app/_context/SocketContext'

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()
  const [chats, setChats] = useState<ChatOverview[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { socket } = useSocket()

  const loadChats = async () => {
    try {
      const allChats = await getUserChats();
      const corruptedChats = allChats.filter(chat => chat.otherUser._id === 'deleted');
      console.log('ALL CHATS RETURNED BY BACKEND:', JSON.stringify(allChats, null, 2));
      
      if (corruptedChats.length > 0) {
        console.log(`Auto-purging ${corruptedChats.length} corrupted chats...`);
        for (const badChat of corruptedChats) {
          try {
            await deleteChatHistory(badChat.chatId);
          } catch (e) {}
        }
        const freshChats = await getUserChats();
        setChats(freshChats);
      } else {
        setChats(allChats);
      }
    } catch (e) {
      console.error('Failed to load chats', e);
    }
  }

  // Load chats when screen mounts
  useEffect(() => {
    loadChats()
  }, [])

  // Reload chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChats()
    }, [])
  )

  useEffect(() => {
    if (!socket) return;
    socket.on('receiveMessage', () => loadChats());
    return () => { socket.off('receiveMessage'); };
  }, [socket]);

  const onRefresh = async () => {
    setRefreshing(true)
    await loadChats()
    setRefreshing(false)
  }

  const handleDeleteChat = (chatId: string, chatName: string) => {
    Alert.alert(
      'Delete Chat',
      `Delete conversation with ${chatName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatHistory(chatId)
              await loadChats()
            } catch (err) {
              Alert.alert('Error', 'Failed to delete chat')
            }
          }
        }
      ]
    )
  }

  const openChat = (chat: ChatOverview) => {
    // Navigate to VendorChatScreen with vendor details
    const vendor = {
        userId: chat.otherUser._id,
        name: chat.otherUser.name,
        // We might not have category/location here, but ChatOverview should eventually provide them
    }
    router.push({
        pathname: '/screens/client/Component/VendorChatScreen',
        params: { 
            vendor: JSON.stringify(vendor),
            chatId: chat.chatId 
        }
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Header */}
      <View className='px-5 py-4 flex-row justify-between items-center' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <View>
          <Text className='text-2xl font-extrabold' style={{color: Colors.textPrimary}}>Messages</Text>
          <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>
            {chats.length} conversation{chats.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Chats List */}
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {chats.length === 0 ? (
          <View className='flex-1 justify-center items-center py-20 px-8'>
            <MessageCircle size={64} color={Colors.textTertiary} />
            <Text className='text-lg font-bold mt-4 text-center' style={{color: Colors.textSecondary}}>No Messages Yet</Text>
            <Text className='text-sm font-medium mt-2 text-center' style={{color: Colors.textTertiary}}>
              Start chatting with vendors to get help planning your event
            </Text>
          </View>
        ) : (
          <View className='py-2'>
            {chats.map((chat) => {
              return (
                <Pressable
                  key={chat.chatId}
                  className='flex-row items-center gap-3 px-5 py-4 active:opacity-70'
                  style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}
                  onPress={() => openChat(chat)}
                >
                  {/* Avatar */}
                  <View
                    className='rounded-full p-3'
                    style={{ backgroundColor: Colors.primary + '20' }}
                  >
                    <MessageCircle size={24} color={Colors.primary} />
                  </View>

                  {/* Chat Info */}
                  <View className='flex-1'>
                    <View className='flex-row items-center justify-between mb-1'>
                      <Text className='text-base font-extrabold flex-1' style={{color: Colors.textPrimary}} numberOfLines={1}>
                        {chat.otherUser.name}
                      </Text>
                      <Text className='text-xs font-medium ml-2' style={{color: Colors.textTertiary}}>
                        {formatTime(chat.lastMessage.createdAt)}
                      </Text>
                    </View>
                    
                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}} numberOfLines={2}>
                      {chat.lastMessage.text}
                    </Text>
                  </View>

                  {/* Unread Badge */}
                  {chat.unreadCount > 0 && (
                    <View className='bg-primary rounded-full px-2 py-0.5 mr-2'>
                      <Text className='text-white text-[10px] font-bold'>{chat.unreadCount}</Text>
                    </View>
                  )}

                  {/* Delete Button */}
                  <Pressable
                    className='p-2 rounded-full active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat.chatId, chat.otherUser.name)
                    }}
                  >
                    <Trash2 size={18} color={Colors.error} />
                  </Pressable>
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background
  },
})