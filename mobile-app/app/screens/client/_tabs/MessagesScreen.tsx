import { ScrollView, StyleSheet, Text, View, Pressable, Alert, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { router } from 'expo-router'
import { MessageCircle, Bot, Trash2, MapPin } from 'lucide-react-native'
import { Colors, getCategoryColor, Shadows } from '@/app/constants/theme'
import { getAllChats, clearAllChats, deleteChat, ChatConversation } from '@/app/utils/chatStorage'

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()
  const [chats, setChats] = useState<ChatConversation[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadChats = async () => {
    const allChats = await getAllChats()
    // Sort by last message time (most recent first)
    const sortedChats = allChats.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
    setChats(sortedChats)
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

  const onRefresh = async () => {
    setRefreshing(true)
    await loadChats()
    setRefreshing(false)
  }

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Chats',
      'Are you sure you want to delete all chat history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllChats()
            setChats([])
          }
        }
      ]
    )
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
            await deleteChat(chatId)
            await loadChats()
          }
        }
      ]
    )
  }

  const openChat = (chat: ChatConversation) => {
    if (chat.type === 'ai') {
      router.push('/screens/client/Component/AIChatScreen')
    } else {
      // For vendor chat, we need to reconstruct the vendor object
      const vendor = {
        name: chat.name,
        category: chat.category,
        location: chat.location
      }
      router.push({
        pathname: '/screens/client/Component/VendorChatScreen',
        params: { vendor: JSON.stringify(vendor) }
      })
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        {chats.length > 0 && (
          <Pressable
            className='flex-row items-center gap-2 px-3 py-2 rounded-xl active:opacity-80'
            style={{backgroundColor: '#fee2e2'}}
            onPress={handleClearAll}
          >
            <Trash2 size={16} color={Colors.error} />
            <Text className='text-xs font-bold' style={{color: Colors.error}}>Clear All</Text>
          </Pressable>
        )}
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
              Start chatting with vendors or use the AI assistant to get help planning your event
            </Text>
          </View>
        ) : (
          <View className='py-2'>
            {chats.map((chat) => {
              const categoryColor = chat.category ? getCategoryColor(chat.category) : Colors.primary

              return (
                <Pressable
                  key={chat.id}
                  className='flex-row items-center gap-3 px-5 py-4 active:opacity-70'
                  style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}
                  onPress={() => openChat(chat)}
                >
                  {/* Avatar */}
                  <View
                    className='rounded-full p-3'
                    style={{
                      backgroundColor: chat.type === 'ai' ? Colors.primary : `${categoryColor}20`,
                    }}
                  >
                    {chat.type === 'ai' ? (
                      <Bot size={24} color={Colors.primary} />
                    ) : (
                      <MessageCircle size={24} color={categoryColor} />
                    )}
                  </View>

                  {/* Chat Info */}
                  <View className='flex-1'>
                    <View className='flex-row items-center justify-between mb-1'>
                      <Text className='text-base font-extrabold flex-1' style={{color: Colors.textPrimary}} numberOfLines={1}>
                        {chat.name}
                      </Text>
                      <Text className='text-xs font-medium ml-2' style={{color: Colors.textTertiary}}>
                        {formatTime(chat.lastMessageTime)}
                      </Text>
                    </View>
                    
                    {chat.type === 'vendor' && chat.location && (
                      <View className='flex-row items-center gap-1 mb-1'>
                        <MapPin size={12} color={Colors.textTertiary} />
                        <Text className='text-xs font-medium' style={{color: Colors.textTertiary}} numberOfLines={1}>
                          {chat.location}
                        </Text>
                      </View>
                    )}
                    
                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}} numberOfLines={2}>
                      {chat.lastMessage}
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <Pressable
                    className='p-2 rounded-full active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat.id, chat.name)
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