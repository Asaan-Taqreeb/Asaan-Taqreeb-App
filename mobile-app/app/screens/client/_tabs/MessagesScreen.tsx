import { ScrollView, StyleSheet, Text, View, Pressable, Alert, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
import { MessageCircle, Trash2 } from 'lucide-react-native'
import { Colors } from '@/app/_constants/theme'
import { getUserChats, deleteChatHistory, ChatOverview } from '@/app/_utils/messagesApi'
import { useSocket } from '@/app/_context/SocketContext'
import Avatar from '@/app/_components/Avatar'

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()
  const [chats, setChats] = useState<ChatOverview[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { socket } = useSocket()

  const loadChats = async () => {
    try {
      const allChats = await getUserChats();
      const corruptedChats = allChats.filter(chat => chat.otherUser._id === 'deleted');
      
      if (corruptedChats.length > 0) {
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
      // Quietly handle load error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadChats()
  }, [])

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
    const vendor = {
        userId: chat.otherUser._id,
        name: chat.otherUser.name,
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
      <View className='px-5 py-5 flex-row justify-between items-center' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
        <View>
          <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>Messages</Text>
          <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>
            {chats.length} active conversation{chats.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {!isLoading && chats.length === 0 ? (
          <View className='flex-1 justify-center items-center py-32 px-8'>
            <View className='w-20 h-20 rounded-full items-center justify-center mb-4' style={{backgroundColor: Colors.lightGray}}>
              <MessageCircle size={32} color={Colors.textTertiary} />
            </View>
            <Text className='text-lg font-bold text-center' style={{color: Colors.textSecondary}}>No Messages Yet</Text>
            <Text className='text-sm font-medium mt-2 text-center' style={{color: Colors.textTertiary}}>
              Start chatting with vendors to plan your event
            </Text>
          </View>
        ) : (
          <View>
            {chats.map((chat) => (
                <Pressable
                  key={chat.chatId}
                  className='flex-row items-center gap-4 px-5 py-5 active:bg-gray-50'
                  style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}
                  onPress={() => openChat(chat)}
                >
                  <Avatar
                    name={chat.otherUser.name}
                    size='md'
                  />

                  <View className='flex-1'>
                    <View className='flex-row items-center justify-between mb-1'>
                      <Text className='text-base font-bold flex-1' style={{color: Colors.textPrimary}} numberOfLines={1}>
                        {chat.otherUser.name}
                      </Text>
                      <Text className='text-xs font-medium ml-2' style={{color: Colors.textTertiary}}>
                        {formatTime(chat.lastMessage.createdAt)}
                      </Text>
                    </View>
                    
                    <View className='flex-row items-center justify-between'>
                      <Text className='text-sm font-medium flex-1 mr-2' style={{color: Colors.textSecondary}} numberOfLines={1}>
                        {chat.lastMessage.text}
                      </Text>
                      
                      {chat.unreadCount > 0 && (
                        <View className='bg-primary rounded-full px-2 py-0.5 mr-2'>
                          <Text className='text-white text-[10px] font-bold'>{chat.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    className='p-2 rounded-full active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat.chatId, chat.otherUser.name)
                    }}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </Pressable>
                </Pressable>
              )
            )}
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