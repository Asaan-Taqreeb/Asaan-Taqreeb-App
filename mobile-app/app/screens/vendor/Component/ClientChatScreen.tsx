import { useRouter, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Send, Paperclip, FileText, Calendar, Video, MapPin, X, Mic } from 'lucide-react-native'
import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ViewStyle, Image, ActivityIndicator, Keyboard, Modal, FlatList } from 'react-native'
import { Audio } from 'expo-av'
import AudioPlayer from '@/app/_components/AudioPlayer'
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
    const flatListRef = useRef<FlatList<Message>>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewerVisible, setViewerVisible] = useState(false)
    const [viewerImages, setViewerImages] = useState<string[]>([])
    const [viewerIndex, setViewerIndex] = useState(0)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    
    // Voice recording states and functions
    const [isRecording, setIsRecording] = useState(false)
    const [recording, setRecording] = useState<Audio.Recording | null>(null)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const recordingTimerRef = useRef<any>(null)
    const [isUploadingVoice, setIsUploadingVoice] = useState(false)

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable microphone access in settings to send voice notes.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            if (recording) {
                await recording.stopAndUnloadAsync().catch(() => {});
            }

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            
            setRecording(newRecording);
            setIsRecording(true);
            setRecordingDuration(0);

            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Recording Error', 'Could not start recording. Please try again.');
        }
    };

    const stopAndSendRecording = async () => {
        if (!recording) return;
        
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (uri && clientId) {
                setIsUploadingVoice(true);

                // Add an optimistic voice message to UI
                const optimisticId = Date.now().toString();
                const optimisticMessage: Message = {
                    _id: optimisticId,
                    chatId,
                    senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                    receiverId: { _id: clientId, name: clientName, email: '' },
                    text: '',
                    audioUrl: uri,
                    isSending: true,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };

                setMessages(prev => [optimisticMessage, ...prev]);

                const savedMessage = normalizeMessage(await sendMessage(
                    chatId, 
                    clientId, 
                    '', 
                    undefined, 
                    undefined, 
                    undefined, 
                    uri
                ));

                setMessages(prev => {
                    if (prev.some(m => m._id === savedMessage._id)) {
                        return prev.filter(m => m._id !== optimisticId);
                    }
                    return prev.map(m => m._id === optimisticId ? { ...savedMessage, isSending: false } : m);
                });
            }
        } catch (error) {
            console.error('Failed to stop and send recording', error);
            Alert.alert('Upload Error', 'Could not upload the voice note. Please try again.');
        } finally {
            setIsUploadingVoice(false);
        }
    };

    const cancelRecording = async () => {
        if (!recording) return;
        
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

        try {
            await recording.stopAndUnloadAsync();
            setRecording(null);
        } catch (err) {
            console.log('Error cancelling recording:', err);
        }
    };

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        };
    }, []);

    const [isOpponentTyping, setIsOpponentTyping] = useState(false)
    const typingTimeoutRef = useRef<any>(null)
    const isTypingRef = useRef(false)

    // Invoice Generator States
    const [invoiceTotal, setInvoiceTotal] = useState('')
    const [invoiceAdvance, setInvoiceAdvance] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
    const [invoiceNotes, setInvoiceNotes] = useState('')
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false)

    // Consultation Scheduler States
    const [showSchedulerModal, setShowSchedulerModal] = useState(false)
    const [schedType, setSchedType] = useState('Video Call')
    const [schedDateIndex, setSchedDateIndex] = useState(0)
    const [schedTime, setSchedTime] = useState('10:00 AM')
    const [schedNote, setSchedNote] = useState('')

    const schedDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return {
            label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
            value: d.toISOString().slice(0, 10)
        }
    })

    const handleUpdateConsultation = async (msgId: string, nextStatus: 'Approved' | 'Declined') => {
        setMessages(prev => prev.map(m => {
            if (m._id === msgId) {
                const lines = m.text.split('\n');
                if (lines[5]) lines[5] = `Status: ${nextStatus}`;
                return { ...m, text: lines.join('\n') };
            }
            return m;
        }))
        
        const textReply = nextStatus === 'Approved' 
            ? `[Consultation Approved] Looking forward to our discussion!`
            : `[Consultation Declined] Sorry, I am not available at this time.`
        
        try {
            if (clientId) {
                await sendMessage(chatId, clientId, textReply)
            }
        } catch (error) {
            console.log("Failed to send consultation reply:", error)
        }
    }

    const handleSendScheduler = async () => {
        if (!clientId) return
        const type = schedType
        const date = schedDates[schedDateIndex].label
        const time = schedTime
        const note = schedNote.trim()

        const text = `[Consultation Request]\nType: ${type}\nDate: ${date}\nTime: ${time}\nNote: ${note}\nStatus: Pending`
        
        const optimisticId = Date.now().toString()
        const optimisticMessage: Message = {
            _id: optimisticId,
            chatId,
            senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
            receiverId: { _id: clientId, name: clientName, email: '' },
            text,
            isRead: false,
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, optimisticMessage])
        setShowSchedulerModal(false)
        setSchedNote('')

        try {
            const savedMessage = normalizeMessage(await sendMessage(chatId, clientId, text))
            setMessages(prev => prev.map(m => m._id === optimisticId ? savedMessage : m))
        } catch (error) {
            Alert.alert('Error', 'Failed to send consultation request.')
        }
    }

    useEffect(() => {
        ImagePicker.requestMediaLibraryPermissionsAsync().catch((error) => {
            console.warn('Failed to prefetch media library permission:', error)
        })
    }, [])

    const [dynamicClientName, setDynamicClientName] = useState('')
    const [dynamicClientId, setDynamicClientId] = useState('')

    // Params will include the client's info
    const clientId = (params.clientId as string) || dynamicClientId
    const clientName = (params.clientName as string) === 'Customer' || (params.clientName as string) === 'Client' || !(params.clientName as string)
        ? (dynamicClientName || (params.clientName as string) || "Client")
        : (params.clientName as string)
    const { socket, isConnected } = useSocket()
    const { user } = useUser()

    const chatId = (params.chatId as string) || (user?.id && clientId ? `chat_${clientId}_${user.id}` : '')

    useEffect(() => {
        if (messages.length > 0 && user?.id) {
            const oppMsg = messages.find(m => m.senderId._id !== user.id)
            if (oppMsg) {
                if (oppMsg.senderId.name && oppMsg.senderId.name !== 'Customer' && oppMsg.senderId.name !== 'Client') {
                    setDynamicClientName(oppMsg.senderId.name);
                }
                setDynamicClientId(oppMsg.senderId._id);
            } else {
                const myMsg = messages.find(m => m.senderId._id === user.id)
                if (myMsg && myMsg.receiverId) {
                    if (myMsg.receiverId.name && myMsg.receiverId.name !== 'Customer' && myMsg.receiverId.name !== 'Client') {
                        setDynamicClientName(myMsg.receiverId.name);
                    }
                    setDynamicClientId(myMsg.receiverId._id);
                }
            }
        }
    }, [messages, user?.id])

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
            setMessages(history.map(normalizeMessage).reverse())
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
        if (!socket || !chatId || !isConnected) return

        const refreshChat = async () => {
            try {
                const history = await getChatHistory(chatId)
                setMessages(history.map(normalizeMessage).reverse())
                await markChatAsRead(chatId)
            } catch (error) {
                console.warn('Failed to refresh chat after socket event:', error)
            }
        }

        const handleReceiveMessage = (newMessage: Message) => {
            const normalizedMessage = normalizeMessage(newMessage)
            setMessages((prev) => {
                // If it's from me, I already handled it optimistically
                if (normalizedMessage.senderId._id === user?.id) return prev;
                
                if (prev.some((msg) => msg._id === normalizedMessage._id)) return prev;
                return [normalizedMessage, ...prev];
            })
            markChatAsRead(chatId)
        }

        const handleTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
            if (userId !== user?.id) {
                setIsOpponentTyping(isTyping)
            }
        }

        socket.emit('joinChat', chatId)
        socket.on('receiveMessage', handleReceiveMessage)
        socket.on('newMessageNotification', refreshChat)
        socket.on('typing', handleTyping)

        return () => {
            socket.emit('leaveChat', chatId)
            socket.off('receiveMessage', handleReceiveMessage)
            socket.off('newMessageNotification', refreshChat)
            socket.off('typing', handleTyping)
        }
    }, [socket, chatId, user, isConnected])

    // Auto-scroll is handled natively by the inverted FlatList container

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
            setMessages(prev => [optimisticMessage, ...prev])
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
            setMessages(prev => [optimisticMessage, ...prev])

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
            setMessages(prev => [optimisticMessage, ...prev])

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

    const renderMessageBody = (msg: Message, isUser: boolean) => {
        if (msg.text && msg.text.startsWith('[Consultation Request]')) {
            const lines = msg.text.split('\n');
            const type = lines[1]?.split(': ')[1] || 'Video Call';
            const date = lines[2]?.split(': ')[1] || '';
            const time = lines[3]?.split(': ')[1] || '';
            const note = lines[4]?.split(': ')[1] || '';
            let status = lines[5]?.split(': ')[1] || 'Pending';

            // Resolve dynamic responses
            const isApprovedLater = messages.some(m => 
                m.createdAt > msg.createdAt && 
                m.text && 
                m.text.includes('[Consultation Approved]')
            )
            const isDeclinedLater = messages.some(m => 
                m.createdAt > msg.createdAt && 
                m.text && 
                m.text.includes('[Consultation Declined]')
            )

            if (isApprovedLater) status = 'Approved'
            else if (isDeclinedLater) status = 'Declined'

            const isVideo = type.toLowerCase().includes('video');
            const IconComponent = isVideo ? Video : MapPin;

            return (
                <View
                    className='rounded-3xl p-5 border'
                    style={{
                        backgroundColor: Colors.white,
                        borderColor: Colors.border,
                        width: 270,
                        ...Shadows.small
                    }}
                >
                    <View className='flex-row items-center gap-3 mb-4'>
                        <View 
                            className='p-3 rounded-2xl' 
                            style={{ backgroundColor: isVideo ? '#eff6ff' : '#f0fdf4' }}
                        >
                            <IconComponent color={isVideo ? Colors.primary : Colors.success} size={22} />
                        </View>
                        <View className='flex-1'>
                            <Text className='text-sm font-extrabold' style={{ color: Colors.textPrimary }}>
                                {isVideo ? '15-Min Video Call' : 'In-Person Venue Visit'}
                            </Text>
                            <Text className='text-xs font-semibold text-slate-400 mt-0.5'>
                                Consultation Request
                            </Text>
                        </View>
                    </View>

                    <View className='bg-slate-50 border border-slate-100 rounded-2xl p-4 gap-2 mb-4'>
                        <View className='flex-row justify-between items-center'>
                            <Text className='text-[10px] font-bold text-slate-400'>DATE</Text>
                            <Text className='text-xs font-extrabold' style={{ color: Colors.textPrimary }}>{date}</Text>
                        </View>
                        <View className='flex-row justify-between items-center'>
                            <Text className='text-[10px] font-bold text-slate-400'>TIME</Text>
                            <Text className='text-xs font-extrabold' style={{ color: Colors.textPrimary }}>{time}</Text>
                        </View>
                        {!!note && (
                            <View className='pt-2 mt-1 border-t border-slate-100'>
                                <Text className='text-[10px] font-bold text-slate-400 mb-0.5'>DISCUSSION TOPIC</Text>
                                <Text className='text-xs font-medium leading-relaxed' style={{ color: Colors.textSecondary }}>{note}</Text>
                            </View>
                        )}
                    </View>

                    <View className='flex-row items-center justify-between'>
                        <Text className='text-xs font-bold text-slate-400 uppercase'>Status</Text>
                        <View 
                            className='px-2.5 py-1 rounded-full'
                            style={{ 
                                backgroundColor: status === 'Approved' ? '#dcfce7' : status === 'Declined' ? '#fee2e2' : '#fef3c7'
                            }}
                        >
                            <Text 
                                className='text-[10px] font-black uppercase tracking-wider' 
                                style={{ 
                                    color: status === 'Approved' ? Colors.success : status === 'Declined' ? Colors.error : Colors.warning
                                }}
                            >
                                {status}
                            </Text>
                        </View>
                    </View>

                    {/* Action buttons if receiver */}
                    {!isUser && status === 'Pending' && (
                        <View className='flex-row gap-2 mt-4 pt-3 border-t border-slate-100'>
                            <Pressable 
                                onPress={() => handleUpdateConsultation(msg._id, 'Declined')}
                                className='flex-1 py-2.5 rounded-xl border border-red-200 items-center justify-center'
                                style={{ backgroundColor: '#FEF2F2' }}
                            >
                                <Text className='text-xs font-bold text-red-600'>Decline</Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => handleUpdateConsultation(msg._id, 'Approved')}
                                className='flex-2 py-2.5 rounded-xl items-center justify-center'
                                style={{ backgroundColor: Colors.success }}
                            >
                                <Text className='text-xs font-bold text-white'>Approve</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Join Meeting button if approved & video */}
                    {status === 'Approved' && isVideo && (
                        <Pressable 
                            onPress={() => Alert.alert('Launching Consultation Room', `Connecting to virtual call with ${clientName}...`)}
                            className='mt-4 py-2.5 rounded-xl items-center justify-center'
                            style={{ backgroundColor: Colors.primary }}
                        >
                            <Text className='text-xs font-bold text-white'>Join Video Meeting</Text>
                        </Pressable>
                    )}
                </View>
            )
        }

        return (
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
                {msg.audioUrl ? (
                    <View style={{ marginBottom: msg.text ? 10 : 0 }}>
                        <AudioPlayer audioUrl={msg.audioUrl} isSender={isUser} />
                        {msg.isSending ? (
                            <View
                                className='absolute inset-0 items-center justify-center rounded-2xl'
                                style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)' }}
                            >
                                <ActivityIndicator size='small' color={Colors.white} />
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
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                inverted
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
                renderItem={({ item: msg }) => {
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
                }}
                ListHeaderComponent={isOpponentTyping ? (
                    <View className='items-start mb-3'>
                        <View
                            className='px-4 py-3 rounded-2xl bg-white border border-gray-100 flex-row items-center gap-2'
                            style={{ borderBottomLeftRadius: 4, borderColor: Colors.border }}
                        >
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">{clientName} is typing...</Text>
                        </View>
                    </View>
                ) : null}
            />

            {/* Message Input */}
            <View className='px-5 py-4' style={{borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white}}>
                {isUploadingImage && (
                    <View className='mb-3 flex-row items-center gap-2 px-3 py-2 rounded-lg' style={{backgroundColor: Colors.lightGray}}>
                        <ActivityIndicator size='small' color={Colors.primary} />
                        <Text className='text-xs font-medium flex-1' style={{color: Colors.textSecondary}}>Uploading image...</Text>
                    </View>
                )}
                {isUploadingVoice && (
                    <View className='mb-3 flex-row items-center gap-2 px-3 py-2 rounded-lg' style={{backgroundColor: Colors.lightGray}}>
                        <ActivityIndicator size='small' color={Colors.primary} />
                        <Text className='text-xs font-medium flex-1' style={{color: Colors.textSecondary}}>Uploading voice message...</Text>
                    </View>
                )}
                <View className='flex-row items-center gap-2'>
                    {isRecording ? (
                        <View className="flex-row items-center flex-1 gap-3 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl" style={{ borderColor: '#FEE2E2' }}>
                            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#dc2626' }} />
                            <Text className="text-red-600 font-extrabold text-sm flex-1" style={{ color: '#dc2626' }}>
                                Recording voice message ({recordingDuration}s)
                            </Text>
                            <Pressable 
                                onPress={cancelRecording}
                                className="px-3 py-1.5 rounded-lg border"
                                style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}
                            >
                                <Text className="text-xs font-bold" style={{ color: '#dc2626' }}>Cancel</Text>
                            </Pressable>
                            <Pressable 
                                onPress={stopAndSendRecording}
                                className="px-3 py-1.5 rounded-lg"
                                style={{ backgroundColor: '#dc2626' }}
                            >
                                <Text className="text-xs font-bold text-white">Send</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            <Pressable
                                className='w-12 h-12 rounded-full items-center justify-center active:opacity-75'
                                style={{backgroundColor: Colors.lightGray}}
                                onPress={sendImageProof}
                                disabled={isUploadingImage || isUploadingVoice}
                            >
                                <Paperclip color={Colors.primary} size={22} />
                            </Pressable>
                            <Pressable
                                className='w-12 h-12 rounded-full items-center justify-center active:opacity-75'
                                style={{backgroundColor: Colors.lightGray}}
                                onPress={() => setShowSchedulerModal(true)}
                                disabled={isUploadingImage || isUploadingVoice}
                            >
                                <Calendar color={Colors.primary} size={22} />
                            </Pressable>
                            <Pressable
                                className='w-12 h-12 rounded-full items-center justify-center active:opacity-75'
                                style={{backgroundColor: Colors.lightGray}}
                                onPress={() => setInvoiceModalVisible(true)}
                                disabled={isUploadingImage || isUploadingVoice}
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
                                editable={!isUploadingImage && !isUploadingVoice}
                            />
                            {message.trim() ? (
                                <Pressable
                                    className='w-12 h-12 rounded-full items-center justify-center active:opacity-80'
                                    style={{backgroundColor: Colors.primary}}
                                    onPress={handleSend}
                                >
                                    <Send color={Colors.white} size={22} fill={Colors.white} />
                                </Pressable>
                            ) : (
                                <Pressable
                                    className='w-12 h-12 rounded-full items-center justify-center active:opacity-80'
                                    style={{backgroundColor: Colors.primary}}
                                    onPress={startRecording}
                                    disabled={isUploadingImage || isUploadingVoice}
                                >
                                    <Mic color={Colors.white} size={22} />
                                </Pressable>
                            )}
                        </>
                    )}
                </View>
            </View>

            {/* Consultation Scheduler Modal */}
            <Modal
                visible={showSchedulerModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSchedulerModal(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl p-6 pb-8" style={Shadows.large}>
                        <View className="flex-row items-center justify-between mb-5">
                            <View>
                                <Text className="text-xl font-black" style={{ color: Colors.textPrimary }}>Schedule Consultation</Text>
                                <Text className="text-xs font-semibold text-slate-400 mt-0.5">With {clientName}</Text>
                            </View>
                            <Pressable 
                                onPress={() => setShowSchedulerModal(false)}
                                className="p-2 rounded-full active:opacity-75"
                                style={{ backgroundColor: Colors.lightGray }}
                            >
                                <X size={20} color={Colors.textPrimary} />
                            </Pressable>
                        </View>

                        {/* Consultation Type Selector */}
                        <Text className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Consultation Type</Text>
                        <View className="flex-row gap-3 mb-4">
                            <Pressable 
                                onPress={() => setSchedType('Video Call')}
                                className="flex-1 p-3 rounded-xl border-2 items-center"
                                style={{
                                    borderColor: schedType === 'Video Call' ? Colors.primary : Colors.border,
                                    backgroundColor: schedType === 'Video Call' ? Colors.primary + '08' : 'transparent'
                                }}
                            >
                                <Video color={schedType === 'Video Call' ? Colors.primary : Colors.textSecondary} size={20} />
                                <Text className="text-xs font-bold mt-1" style={{ color: schedType === 'Video Call' ? Colors.primary : Colors.textSecondary }}>Video Call</Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => setSchedType('Venue Visit')}
                                className="flex-1 p-3 rounded-xl border-2 items-center"
                                style={{
                                    borderColor: schedType === 'Venue Visit' ? Colors.primary : Colors.border,
                                    backgroundColor: schedType === 'Venue Visit' ? Colors.primary + '08' : 'transparent'
                                }}
                            >
                                <MapPin color={schedType === 'Venue Visit' ? Colors.primary : Colors.textSecondary} size={20} />
                                <Text className="text-xs font-bold mt-1" style={{ color: schedType === 'Venue Visit' ? Colors.primary : Colors.textSecondary }}>Venue Visit</Text>
                            </Pressable>
                        </View>

                        {/* Date Picker (Horizontal List) */}
                        <Text className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Date</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {schedDates.map((d, index) => (
                                <Pressable 
                                    key={index}
                                    onPress={() => setSchedDateIndex(index)}
                                    className="px-4 py-3 rounded-xl border-2 mr-2 items-center justify-center"
                                    style={{
                                        borderColor: schedDateIndex === index ? Colors.primary : Colors.border,
                                        backgroundColor: schedDateIndex === index ? Colors.primary + '08' : 'transparent',
                                        minWidth: 80
                                    }}
                                >
                                    <Text className="text-xs font-bold" style={{ color: schedDateIndex === index ? Colors.primary : Colors.textPrimary }}>
                                        {d.label.split(',')[0]}
                                    </Text>
                                    <Text className="text-[10px] font-bold text-slate-400 mt-0.5">
                                        {d.label.split(',')[1]}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {/* Time Slot Selector */}
                        <Text className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Time Slot</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((t) => (
                                <Pressable 
                                    key={t}
                                    onPress={() => setSchedTime(t)}
                                    className="px-3 py-2.5 rounded-lg border-2 items-center justify-center"
                                    style={{
                                        borderColor: schedTime === t ? Colors.primary : Colors.border,
                                        backgroundColor: schedTime === t ? Colors.primary + '08' : 'transparent',
                                        width: '48%'
                                    }}
                                >
                                    <Text className="text-xs font-bold" style={{ color: schedTime === t ? Colors.primary : Colors.textPrimary }}>{t}</Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Special Note */}
                        <Text className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">What would you like to discuss?</Text>
                        <TextInput 
                            value={schedNote}
                            onChangeText={setSchedNote}
                            placeholder="Add brief details (e.g. customized packages)..."
                            placeholderTextColor={Colors.textTertiary}
                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm mb-5"
                            style={{ color: Colors.textPrimary }}
                        />

                        {/* Action buttons */}
                        <View className="flex-row gap-3">
                            <Pressable 
                                onPress={() => setShowSchedulerModal(false)}
                                className="flex-1 py-3.5 rounded-xl border border-slate-200 items-center justify-center"
                            >
                                <Text className="font-bold text-slate-500">Cancel</Text>
                            </Pressable>
                            <Pressable 
                                onPress={handleSendScheduler}
                                className="flex-2 py-3.5 rounded-xl items-center justify-center"
                                style={{ backgroundColor: Colors.primary, flex: 2 }}
                            >
                                <Text className="font-extrabold text-white text-base">Send Request</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

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
