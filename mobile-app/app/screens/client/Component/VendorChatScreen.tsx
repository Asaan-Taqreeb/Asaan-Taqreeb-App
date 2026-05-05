import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Send } from 'lucide-react-native'
import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor } from '@/app/_constants/theme'
import { getChatHistory, sendMessage, markChatAsRead, Message } from '@/app/_utils/messagesApi'
import { useSocket } from '@/app/_context/SocketContext'
import { useUser } from '@/app/_context/UserContext'

export default function VendorChatScreen() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)

    let vendor = null
    if (params.vendor) {
        try {
            vendor = JSON.parse(params.vendor as string)
        } catch {
            vendor = null
        }
    }

    const vendorName = vendor?.name || "Vendor"
    const vendorCategory = vendor?.category || ""
    const vendorLocation = vendor?.location || ""
    const categoryColor = vendor ? getCategoryColor(vendor.category) : Colors.primary
    const targetUserId = vendor?.userId || vendor?.vendorId;

    const { socket } = useSocket()
    const { user } = useUser()

    const chatId = (params.chatId as string) || (user?.id && targetUserId ? `chat_${user.id}_${targetUserId}` : `vendor-${vendorName.toLowerCase().replace(/\s+/g, '-')}`)

    const loadChatHistory = useCallback(async () => {
        try {
            const history = await getChatHistory(chatId)
            setMessages(history)
            await markChatAsRead(chatId)
        } catch (error) {
            console.log('Error loading chat history:', error)
        } finally {
            setIsLoading(false)
        }
    }, [chatId])

    useEffect(() => {
        loadChatHistory()
    }, [loadChatHistory])

    useEffect(() => {
        if (!socket || !chatId) return

        socket.emit('joinChat', chatId)

        socket.on('receiveMessage', (newMessage: Message) => {
            setMessages((prev) => {
                // If it's from me, I already handled it optimistically
                if (newMessage.senderId._id === user?.id) return prev;
                
                // Check if we already have it (safety check)
                if (prev.some((msg) => msg._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            })
            markChatAsRead(chatId)
        })

        return () => {
            socket.emit('leaveChat', chatId)
            socket.off('receiveMessage')
        }
    }, [socket, chatId, user])

    useEffect(() => {
        if (!isLoading) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if (message.trim() && targetUserId) {
            const textToSend = message.trim()
            setMessage('')
            
            // Optimistic update
            const optimisticMessage: Message = {
                _id: Date.now().toString(),
                chatId,
                senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                receiverId: { _id: targetUserId, name: vendorName, email: '' },
                text: textToSend,
                isRead: false,
                createdAt: new Date().toISOString()
            }
            setMessages(prev => [...prev, optimisticMessage])

            try {
                const savedMessage = await sendMessage(chatId, targetUserId, textToSend)
                setMessages(prev => {
                    // If socket already added the real message, just remove the optimistic placeholder
                    if (prev.some(m => m._id === savedMessage._id)) {
                        return prev.filter(m => m._id !== optimisticMessage._id)
                    }
                    // Otherwise replace the optimistic with the saved message
                    return prev.map(m => m._id === optimisticMessage._id ? savedMessage : m)
                })
            } catch (error) {
                console.error("Failed to send message", error)
                import('react-native').then(({ Alert }) => Alert.alert('Error', 'Failed to send message. Please try again.'));
            }
        } else {
            console.warn("Missing message text or vendor user ID");
            import('react-native').then(({ Alert }) => Alert.alert('Error', 'Cannot send message: Vendor ID is missing. This service might not be fully configured.'));
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    if (isLoading) {
        return (
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <View className='flex-1 justify-center items-center'>
                    <Text style={{color: Colors.textSecondary}}>Loading chat...</Text>
                </View>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
                <Pressable
                    className='rounded-full p-2 active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={() => router.back()}
                >
                    <ArrowLeft color={categoryColor} size={24} />
                </Pressable>
                <View className='flex-1'>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>{vendorName}</Text>
                    <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Online</Text>
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className='flex-1 px-5 py-4'
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => {
                    const isUser = msg.senderId._id === user?.id
                    return (
                    <View
                        key={msg._id}
                        className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                        <View
                            className='px-4 py-3 rounded-2xl max-w-[75%]'
                            style={{
                                backgroundColor: isUser ? categoryColor : Colors.white,
                                borderWidth: !isUser ? 1 : 0,
                                borderColor: Colors.border
                            }}
                        >
                            <Text
                                className='text-base leading-relaxed'
                                style={{color: isUser ? Colors.white : Colors.textPrimary}}
                            >
                                {msg.text}
                            </Text>
                        </View>
                        <Text className='text-xs mt-1 px-1' style={{color: Colors.textTertiary}}>
                            {formatTime(new Date(msg.createdAt))}
                        </Text>
                    </View>
                    )
                })}
            </ScrollView>

            {/* Message Input */}
            <View className='px-5 py-4' style={{borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white}}>
                <View className='flex-row items-center gap-3'>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder='Type a message...'
                        placeholderTextColor={Colors.textTertiary}
                        className='flex-1 rounded-full px-5 py-3 text-base'
                        style={{backgroundColor: Colors.lightGray, color: Colors.textPrimary}}
                        multiline
                        maxLength={500}
                    />
                    <Pressable
                        className='rounded-full p-3 active:opacity-80'
                        style={{backgroundColor: message.trim() ? categoryColor : Colors.borderDark}}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send color={Colors.white} size={24} fill={Colors.white} />
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
})
