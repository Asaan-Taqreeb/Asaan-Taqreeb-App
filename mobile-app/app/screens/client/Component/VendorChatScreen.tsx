import { useRouter, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Send, Paperclip } from 'lucide-react-native'
import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ViewStyle, Image, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor } from '@/app/_constants/theme'
import { getChatHistory, sendMessage, markChatAsRead, Message } from '@/app/_utils/messagesApi'
import { useSocket } from '@/app/_context/SocketContext'
import { useUser } from '@/app/_context/UserContext'
import * as ImagePicker from 'expo-image-picker'
import ImageViewerModal from '@/app/_components/ImageViewerModal'

export default function VendorChatScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [viewerVisible, setViewerVisible] = useState(false)
    const [viewerImages, setViewerImages] = useState<string[]>([])
    const [viewerIndex, setViewerIndex] = useState(0)

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
    const isGuest = Boolean(user?.isGuest)

    useEffect(() => {
        ImagePicker.requestMediaLibraryPermissionsAsync().catch((error) => {
            console.warn('Failed to prefetch media library permission:', error)
        })
    }, [])

    const chatId = (params.chatId as string) || (user?.id && targetUserId ? `chat_${user.id}_${targetUserId}` : `vendor-${vendorName.toLowerCase().replace(/\s+/g, '-')}`)

    const normalizeMessage = useCallback((msg: Message) => {
        const raw = msg as Message & { image?: string; image_url?: string }
        return {
            ...msg,
            imageUrl: raw.imageUrl || raw.image || raw.image_url || '',
        }
    }, [])

    const loadChatHistory = useCallback(async () => {
        if (isGuest) {
            setIsLoading(false)
            return
        }

        try {
            const history = await getChatHistory(chatId)
            setMessages(history.map(normalizeMessage))
            await markChatAsRead(chatId)
        } catch (error) {
            console.log('Error loading chat history:', error)
        } finally {
            setIsLoading(false)
        }
    }, [chatId, isGuest, normalizeMessage])

    useEffect(() => {
        loadChatHistory()
    }, [loadChatHistory])

    useEffect(() => {
        if (isGuest || !socket || !chatId) return

        socket.emit('joinChat', chatId)

        socket.on('receiveMessage', (newMessage: Message) => {
            const normalizedMessage = normalizeMessage(newMessage)
            console.log('Received message from socket:', normalizedMessage)
            
            // Validate the message structure
            if (!normalizedMessage || typeof normalizedMessage !== 'object') {
                console.warn('Invalid message received from socket:', normalizedMessage)
                return
            }
            
            if (!normalizedMessage._id || !normalizedMessage.senderId || !normalizedMessage.receiverId) {
                console.warn('Message missing required fields:', normalizedMessage)
                return
            }
            
            setMessages((prev) => {
                // If it's from me, I already handled it optimistically
                if (normalizedMessage.senderId._id === user?.id) return prev;
                
                // Check if we already have it (safety check)
                if (prev.some((msg) => msg._id === normalizedMessage._id)) return prev;
                return [...prev, normalizedMessage];
            })
            markChatAsRead(chatId)
        })

        return () => {
            socket.emit('leaveChat', chatId)
            socket.off('receiveMessage')
        }
    }, [socket, chatId, user, isGuest])

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
                Alert.alert('Error', 'Failed to send message. Please try again.');
            }
        } else {
            console.warn("Missing message text or vendor user ID");
            Alert.alert('Error', 'Cannot send message: Vendor ID is missing.');
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const renderMessageBody = (msg: Message, isUser: boolean) => (
        <View
            className='px-4 py-3 rounded-2xl max-w-[78%]'
            style={{
                backgroundColor: isUser ? categoryColor : Colors.white,
                borderWidth: !isUser ? 1 : 0,
                borderColor: Colors.border
            }}
        >
            {msg.imageUrl ? (
                <View style={{ marginBottom: msg.text ? 10 : 0 }}>
                    <Pressable
                        onPress={() => {
                            const imageOnlyMessages = messages.filter((item) => Boolean(item.imageUrl))
                            const images = imageOnlyMessages.map((item) => item.imageUrl as string)
                            const currentIndex = Math.max(0, images.findIndex((uri) => uri === msg.imageUrl))
                            setViewerImages(images)
                            setViewerIndex(currentIndex)
                            setViewerVisible(true)
                        }}
                    >
                        <Image
                            source={{ uri: msg.imageUrl }}
                            style={{ width: 220, height: 220, borderRadius: 16, opacity: msg.isSending ? 0.7 : 1 }}
                            resizeMode='cover'
                        />
                    </Pressable>
                    {msg.isSending ? (
                        <View
                            className='absolute inset-0 items-center justify-center rounded-2xl'
                            style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)' }}
                        >
                            <ActivityIndicator size='small' color={Colors.white} />
                            <Text className='text-xs font-semibold mt-2' style={{ color: Colors.white }}>Sending...</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}
            {msg.text ? (
                <Text
                    className='text-base leading-relaxed'
                    style={{color: isUser ? Colors.white : Colors.textPrimary}}
                >
                    {msg.text}
                </Text>
            ) : null}
        </View>
    )

    const sendImageProof = useCallback(async () => {
        if (!targetUserId || !chatId || isUploadingImage) return

        try {
            const permission = await ImagePicker.getMediaLibraryPermissionsAsync()
            const activePermission = permission.granted ? permission : await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (!activePermission.granted) {
                Alert.alert('Permission Required', 'Please allow gallery access to send payment proof.')
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.85,
                allowsEditing: false,
            })

            if (result.canceled) {
                console.log('Image picker cancelled by user')
                return
            }

            if (!result.assets || result.assets.length === 0) {
                Alert.alert('No Image Selected', 'Please select an image to send.')
                return
            }

            const asset = result.assets[0]
            if (!asset || !asset.uri) {
                console.error('Invalid asset:', asset)
                Alert.alert('Invalid Image', 'Could not read the selected image. Please try again.')
                return
            }

            const textToSend = message.trim() || 'Payment proof attached'
            const optimisticId = Date.now().toString()

            const optimisticMessage: Message = {
                _id: optimisticId,
                chatId,
                senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                receiverId: { _id: targetUserId, name: vendorName, email: '' },
                text: textToSend,
                imageUrl: asset.uri,
                isSending: true,
                isRead: false,
                createdAt: new Date().toISOString()
            }
            
            console.log('Adding optimistic local preview message:', optimisticMessage)
            setIsUploadingImage(true)
            setMessages(prev => [...prev, optimisticMessage])
            setMessage('')

            console.log('Sending message to backend...')
            const savedMessage = normalizeMessage(await sendMessage(chatId, targetUserId, textToSend, undefined, undefined, asset.uri))
            console.log('Backend saved message:', savedMessage)
            
            setMessages(prev => {
                if (prev.some(m => m._id === savedMessage._id)) {
                    return prev.filter(m => m._id !== optimisticId)
                }
                return prev.map(m => m._id === optimisticId ? { ...savedMessage, isSending: false } : m)
            })
            setIsUploadingImage(false)
        } catch (error: any) {
            console.error('Failed to send image proof - Full Error:', error)
            console.error('Error Name:', error?.name)
            console.error('Error Message:', error?.message)
            console.error('Error Stack:', error?.stack)
            if (typeof error === 'object') {
                console.error('Error Object Keys:', Object.keys(error))
            }
            setMessages(prev => prev.filter(m => !m.isSending))
            Alert.alert('Upload Error', 'Could not upload the image. Please try again.')
            setIsUploadingImage(false)
        }
    }, [chatId, isUploadingImage, message, targetUserId, user?.id, user?.name, vendorName])

    if (isGuest) {
        return (
            <View style={StyleSheet.flatten([styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]) as ViewStyle}>
                <View className='flex-1 justify-center items-center px-6'>
                    <Text className='text-2xl font-extrabold text-center' style={{color: Colors.textPrimary}}>Chat is unavailable in guest mode</Text>
                    <Text className='text-sm font-medium text-center mt-3' style={{color: Colors.textSecondary}}>
                        Sign in to message vendors and track conversations.
                    </Text>
                    <Pressable
                        className='mt-6 px-6 py-4 rounded-2xl active:opacity-85'
                        style={{backgroundColor: categoryColor}}
                        onPress={() => router.push('/screens/client/Component/LoginScreen')}
                    >
                        <Text className='font-extrabold text-base' style={{color: Colors.white}}>Sign In</Text>
                    </Pressable>
                </View>
            </View>
        )
    }

    if (isLoading) {
        return (
            <View style={StyleSheet.flatten([styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]) as ViewStyle}>
                <View className='flex-1 justify-center items-center'>
                    <Text style={{color: Colors.textSecondary}}>Loading chat...</Text>
                </View>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: Colors.background }}>
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
                onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => {
                    const isUser = msg.senderId._id === user?.id
                    return (
                    <View
                        key={msg._id}
                        className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                        {renderMessageBody(msg, isUser)}
                        <Text className='text-xs mt-1 px-1' style={{color: Colors.textTertiary}}>
                            {formatTime(new Date(msg.createdAt))}
                        </Text>
                    </View>
                    )
                })}
            </ScrollView>

            {/* Message Input */}
            <View className='px-5 py-4' style={{borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white}}>
                {isUploadingImage && (
                    <View className='mb-3 flex-row items-center gap-2 px-3 py-2 rounded-lg' style={{backgroundColor: Colors.lightGray}}>
                        <ActivityIndicator size='small' color={categoryColor} />
                        <Text className='text-xs font-medium flex-1' style={{color: Colors.textSecondary}}>Uploading payment proof...</Text>
                    </View>
                )}
                <View className='flex-row items-center gap-2'>
                    <Pressable
                        className='w-12 h-12 rounded-full items-center justify-center active:opacity-75'
                        style={{backgroundColor: Colors.lightGray}}
                        onPress={sendImageProof}
                        disabled={isUploadingImage}
                    >
                        <Paperclip color={categoryColor} size={22} />
                    </Pressable>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder='Add a note...'
                        placeholderTextColor={Colors.textTertiary}
                        className='flex-1 rounded-2xl px-4 py-3 text-base'
                        style={{backgroundColor: Colors.lightGray, color: Colors.textPrimary}}
                        multiline
                        maxLength={500}
                    />
                    <Pressable
                        className='w-12 h-12 rounded-full items-center justify-center active:opacity-80'
                        style={{backgroundColor: message.trim() ? categoryColor : Colors.borderDark}}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send color={Colors.white} size={22} fill={Colors.white} />
                    </Pressable>
                </View>
                <Text className='text-xs mt-2 px-1' style={{color: Colors.textTertiary}}>Tip: Use the attachment button to send payment screenshots</Text>
            </View>

            <ImageViewerModal
                visible={viewerVisible}
                images={viewerImages}
                index={viewerIndex}
                onRequestClose={() => setViewerVisible(false)}
            />
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
