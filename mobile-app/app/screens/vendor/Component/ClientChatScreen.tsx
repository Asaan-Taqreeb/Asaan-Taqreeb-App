import { useRouter, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Send, Paperclip, FileText } from 'lucide-react-native'
import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ViewStyle, Image, ActivityIndicator, Keyboard, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows } from '@/app/_constants/theme'
import { getChatHistory, sendMessage, markChatAsRead, Message } from '@/app/_utils/messagesApi'
import { useSocket } from '@/app/_context/SocketContext'
import { useUser } from '@/app/_context/UserContext'
import ImageViewerModal from '@/app/_components/ImageViewerModal'
import * as ImagePicker from 'expo-image-picker'

export default function ClientChatScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewerVisible, setViewerVisible] = useState(false)
    const [viewerImages, setViewerImages] = useState<string[]>([])
    const [viewerIndex, setViewerIndex] = useState(0)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isOpponentTyping, setIsOpponentTyping] = useState(false)
    const typingTimeoutRef = useRef<any>(null)
    const isTypingRef = useRef(false)

    // Invoice Generator States
    const [invoiceTotal, setInvoiceTotal] = useState('')
    const [invoiceAdvance, setInvoiceAdvance] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
    const [invoiceNotes, setInvoiceNotes] = useState('')
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false)

    useEffect(() => {
        ImagePicker.requestMediaLibraryPermissionsAsync().catch((error) => {
            console.warn('Failed to prefetch media library permission:', error)
        })
    }, [])

    // Params will include the client's info
    const clientId = params.clientId as string
    const clientName = params.clientName as string || "Client"
    const { socket } = useSocket()
    const { user } = useUser()

    const chatId = (params.chatId as string) || (user?.id && clientId ? `chat_${clientId}_${user.id}` : '')

    const normalizeMessage = useCallback((msg: Message) => {
        const raw = msg as Message & { image?: string; image_url?: string }
        return {
            ...msg,
            imageUrl: raw.imageUrl || raw.image || raw.image_url || '',
        }
    }, [])

    const loadChatHistory = useCallback(async () => {
        if (!chatId) return
        try {
            const history = await getChatHistory(chatId)
            setMessages(history.map(normalizeMessage))
            await markChatAsRead(chatId)
        } catch (error) {
            console.log('Error loading chat history:', error)
        } finally {
            setIsLoading(false)
        }
    }, [chatId, normalizeMessage])

    useEffect(() => {
        loadChatHistory()
    }, [loadChatHistory])

    useEffect(() => {
        if (!socket || !chatId) return

        socket.emit('joinChat', chatId)

        socket.on('receiveMessage', (newMessage: Message) => {
            const normalizedMessage = normalizeMessage(newMessage)
            setMessages((prev) => {
                // If it's from me, I already handled it optimistically
                if (normalizedMessage.senderId._id === user?.id) return prev;
                
                if (prev.some((msg) => msg._id === normalizedMessage._id)) return prev;
                return [...prev, normalizedMessage];
            })
            markChatAsRead(chatId)
        })

        socket.on('typing', ({ userId, isTyping }) => {
            if (userId !== user?.id) {
                setIsOpponentTyping(isTyping)
            }
        })

        return () => {
            socket.emit('leaveChat', chatId)
            socket.off('receiveMessage')
            socket.off('typing')
        }
    }, [socket, chatId, user])

    useEffect(() => {
        if (!isLoading) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [messages, isLoading])

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }, 100)
        })
        return () => {
            showSubscription.remove()
        }
    }, [])

    const handleTextChange = (text: string) => {
        setMessage(text)

        if (!socket || !chatId) return

        if (!isTypingRef.current) {
            isTypingRef.current = true
            socket.emit('typing', { bookingId: chatId, isTyping: true })
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false
            socket.emit('typing', { bookingId: chatId, isTyping: false })
        }, 2000)
    }

    const sendImageProof = useCallback(async () => {
        if (!clientId || !chatId || isUploadingImage) return

        try {
            const permission = await ImagePicker.getMediaLibraryPermissionsAsync()
            const activePermission = permission.granted ? permission : await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (!activePermission.granted) {
                Alert.alert('Permission Required', 'Please allow gallery access to attach images.')
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

            const textToSend = message.trim() || 'Attached image'
            const optimisticId = Date.now().toString()

            const optimisticMessage: Message = {
                _id: optimisticId,
                chatId,
                senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                receiverId: { _id: clientId, name: clientName, email: '' },
                text: textToSend,
                imageUrl: asset.uri,
                isSending: true,
                isRead: false,
                createdAt: new Date().toISOString()
            }
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            isTypingRef.current = false
            if (socket) {
                socket.emit('typing', { bookingId: chatId, isTyping: false })
            }

            setIsUploadingImage(true)
            setMessages(prev => [...prev, optimisticMessage])
            setMessage('')

            const savedMessage = normalizeMessage(await sendMessage(chatId, clientId, textToSend, undefined, undefined, asset.uri))
            
            setMessages(prev => {
                if (prev.some(m => m._id === savedMessage._id)) {
                    return prev.filter(m => m._id !== optimisticId)
                }
                return prev.map(m => m._id === optimisticId ? { ...savedMessage, isSending: false } : m)
            })
            setIsUploadingImage(false)
        } catch (error: any) {
            console.error('Failed to send image:', error)
            setMessages(prev => prev.filter(m => !m.isSending))
            Alert.alert('Upload Error', 'Could not upload the image. Please try again.')
            setIsUploadingImage(false)
        }
    }, [chatId, isUploadingImage, message, clientId, clientName, user?.id, user?.name, socket, normalizeMessage])

    const handleSend = async () => {
        if (message.trim() && clientId && chatId) {
            const textToSend = message.trim()
            setMessage('')

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            isTypingRef.current = false
            if (socket) {
                socket.emit('typing', { bookingId: chatId, isTyping: false })
            }
            
            // Optimistic update
            const optimisticMessage: Message = {
                _id: Date.now().toString(),
                chatId,
                senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                receiverId: { _id: clientId, name: clientName, email: '' },
                text: textToSend,
                isRead: false,
                createdAt: new Date().toISOString()
            }
            setMessages(prev => [...prev, optimisticMessage])

            try {
                const savedMessage = normalizeMessage(await sendMessage(chatId, clientId, textToSend))
                setMessages(prev => {
                    // If socket already added the real message, just remove the optimistic placeholder
                    if (prev.some(m => m._id === savedMessage._id)) {
                        return prev.filter(m => m._id !== optimisticMessage._id)
                    }
                    return prev.map(m => m._id === optimisticMessage._id ? savedMessage : m)
                })
            } catch (error) {
                console.error("Failed to send message", error)
            }
        }
    }

    const handleSendInvoice = async () => {
        const total = Number(invoiceTotal)
        const advance = Number(invoiceAdvance)
        if (isNaN(total) || total <= 0) {
            Alert.alert('Invalid Total', 'Please enter a valid total booking amount.')
            return
        }
        if (isNaN(advance) || advance < 0 || advance > total) {
            Alert.alert('Invalid Advance', 'Advance payment cannot exceed the total amount.')
            return
        }

        const remaining = total - advance
        const text = `========================
📄 BOOKING INVOICE / RECEIPT
========================
Event Date: ${invoiceDate || 'Not specified'}
Total Value: PKR ${total.toLocaleString()}
Advance Paid: PKR ${advance.toLocaleString()}
Remaining: PKR ${remaining.toLocaleString()}
------------------------
Notes: ${invoiceNotes.trim() || 'Coordinated terms.'}
========================
Generated by ${user?.name || 'Vendor Partner'}`

        setInvoiceModalVisible(false)
        setInvoiceTotal('')
        setInvoiceAdvance('')
        setInvoiceNotes('')

        if (chatId && clientId) {
            // Optimistic update
            const optimisticMessage: Message = {
                _id: Date.now().toString(),
                chatId,
                senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                receiverId: { _id: clientId, name: clientName, email: '' },
                text,
                isRead: false,
                createdAt: new Date().toISOString()
            }
            setMessages(prev => [...prev, optimisticMessage])

            try {
                const savedMessage = normalizeMessage(await sendMessage(chatId, clientId, text))
                setMessages(prev => {
                    if (prev.some(m => m._id === savedMessage._id)) {
                        return prev.filter(m => m._id !== optimisticMessage._id)
                    }
                    return prev.map(m => m._id === optimisticMessage._id ? savedMessage : m)
                })
            } catch (error) {
                console.error("Failed to send invoice", error)
                Alert.alert('Error', 'Failed to send invoice.')
            }
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const renderMessageBody = (msg: Message, isUser: boolean) => (
        <View
            className='px-4 py-3 rounded-2xl max-w-[75%]'
            style={{
                backgroundColor: isUser ? Colors.primary : Colors.white,
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
            <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
                <Pressable
                    className='rounded-full p-2 active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={() => router.back()}
                >
                    <ArrowLeft color={Colors.primary} size={24} />
                </Pressable>
                <View className='flex-1'>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>{clientName}</Text>
                    <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Client</Text>
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className='flex-1 px-5 py-4'
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true })
                    }, 50)
                }}
                onLayout={() => {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true })
                    }, 50)
                }}
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
                {isOpponentTyping && (
                    <View className='items-start mb-3'>
                        <View
                            className='px-4 py-3 rounded-2xl bg-white border border-gray-100 flex-row items-center gap-2'
                            style={{ borderBottomLeftRadius: 4, borderColor: Colors.border }}
                        >
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">{clientName} is typing...</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Message Input */}
            <View className='px-5 py-4' style={{borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white}}>
                {isUploadingImage && (
                    <View className='mb-3 flex-row items-center gap-2 px-3 py-2 rounded-lg' style={{backgroundColor: Colors.lightGray}}>
                        <ActivityIndicator size='small' color={Colors.primary} />
                        <Text className='text-xs font-medium flex-1' style={{color: Colors.textSecondary}}>Uploading image...</Text>
                    </View>
                )}
                <View className='flex-row items-center gap-2'>
                    <Pressable
                        className='w-12 h-12 rounded-full items-center justify-center active:opacity-75'
                        style={{backgroundColor: Colors.lightGray}}
                        onPress={sendImageProof}
                        disabled={isUploadingImage}
                    >
                        <Paperclip color={Colors.primary} size={22} />
                    </Pressable>
                    <Pressable
                        className='w-12 h-12 rounded-full items-center justify-center active:opacity-75'
                        style={{backgroundColor: Colors.lightGray}}
                        onPress={() => setInvoiceModalVisible(true)}
                        disabled={isUploadingImage}
                    >
                        <FileText color={Colors.primary} size={22} />
                    </Pressable>
                    <TextInput
                        value={message}
                        onChangeText={handleTextChange}
                        placeholder='Type a message...'
                        placeholderTextColor={Colors.textTertiary}
                        className='flex-1 rounded-2xl px-4 py-3 text-base'
                        style={{backgroundColor: Colors.lightGray, color: Colors.textPrimary}}
                        multiline
                        maxLength={500}
                    />
                    <Pressable
                        className='w-12 h-12 rounded-full items-center justify-center active:opacity-80'
                        style={{backgroundColor: message.trim() ? Colors.primary : Colors.borderDark}}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send color={Colors.white} size={22} fill={Colors.white} />
                    </Pressable>
                </View>
            </View>

            <ImageViewerModal
                visible={viewerVisible}
                images={viewerImages}
                index={viewerIndex}
                onRequestClose={() => setViewerVisible(false)}
            />

            {/* Invoice Generator Modal */}
            <Modal
                visible={invoiceModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setInvoiceModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50 px-6">
                    <View className="bg-white rounded-3xl p-6 w-full max-w-sm" style={Shadows.large}>
                        <Text className="text-xl font-black mb-4" style={{ color: Colors.textPrimary }}>Create Invoice</Text>
                        
                        <View className="gap-4">
                          <View>
                            <Text className="text-xs font-bold text-slate-400 mb-1">EVENT DATE</Text>
                            <TextInput
                                value={invoiceDate}
                                onChangeText={setInvoiceDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={Colors.textTertiary}
                                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm"
                                style={{ color: Colors.textPrimary }}
                            />
                          </View>

                          <View className="flex-row gap-3">
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-slate-400 mb-1">TOTAL AMOUNT</Text>
                              <TextInput
                                  value={invoiceTotal}
                                  onChangeText={setInvoiceTotal}
                                  placeholder="PKR"
                                  keyboardType="numeric"
                                  placeholderTextColor={Colors.textTertiary}
                                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm"
                                  style={{ color: Colors.textPrimary }}
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-slate-400 mb-1">ADVANCE PAID</Text>
                              <TextInput
                                  value={invoiceAdvance}
                                  onChangeText={setInvoiceAdvance}
                                  placeholder="PKR"
                                  keyboardType="numeric"
                                  placeholderTextColor={Colors.textTertiary}
                                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm"
                                  style={{ color: Colors.textPrimary }}
                              />
                            </View>
                          </View>

                          <View>
                            <Text className="text-xs font-bold text-slate-400 mb-1">SPECIAL NOTES</Text>
                            <TextInput
                                value={invoiceNotes}
                                onChangeText={setInvoiceNotes}
                                placeholder="Add custom terms..."
                                placeholderTextColor={Colors.textTertiary}
                                multiline
                                numberOfLines={2}
                                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm"
                                style={{ color: Colors.textPrimary, textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>

                        <View className="flex-row gap-3 mt-6">
                            <Pressable 
                                className="flex-1 py-3 rounded-xl border border-slate-200 items-center"
                                onPress={() => setInvoiceModalVisible(false)}
                            >
                                <Text className="font-bold text-slate-500">Cancel</Text>
                            </Pressable>
                            <Pressable 
                                className="flex-1 py-3 rounded-xl items-center"
                                style={{ backgroundColor: Colors.primary }}
                                onPress={handleSendInvoice}
                            >
                                <Text className="font-bold text-white">Send</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
