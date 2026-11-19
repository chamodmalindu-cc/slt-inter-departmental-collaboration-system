import { useEffect, useState, useRef, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getMyChatRooms,
  getChatRoomMessages,
  sendChatMessage,
  markChatRoomRead,
  getChatRoomByProject,
  uploadChatAttachment,
  downloadChatAttachment,
  viewChatAttachmentInline
} from '../../services/api'
import { chatHub } from '../../services/chatHubService'
import type { ChatRoomSummary, ChatMessage, ChatAttachmentInfo } from '../../types/auth'
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Sparkles,
  ShieldAlert,
  Plus,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'

function getRolePill(role: string) {
  switch (role) {
    case 'DGM':
      return { label: 'DGM', bg: 'bg-purple-100 text-purple-800 border-purple-200' }
    case 'DIGITAL_LAB_USER':
      return { label: 'Lab Supervisor', bg: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'NON_DIGITAL_LAB_USER':
      return { label: 'Requester', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'ADMIN':
      return { label: 'Admin', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    default:
      return { label: role, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileBadge(ext: string) {
  const e = (ext || '').toLowerCase()
  if (e === '.pdf') {
    return { label: 'PDF', icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200' }
  }
  if (['.doc', '.docx'].includes(e)) {
    return { label: 'WORD', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' }
  }
  if (['.xls', '.xlsx'].includes(e)) {
    return { label: 'EXCEL', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
  }
  if (['.ppt', '.pptx'].includes(e)) {
    return { label: 'PPT', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-200' }
  }
  if (['.jpg', '.jpeg', '.png'].includes(e)) {
    return { label: 'IMAGE', icon: FileImage, color: 'text-purple-600 bg-purple-50 border-purple-200' }
  }
  if (['.txt', '.csv'].includes(e)) {
    return { label: e.replace('.', '').toUpperCase(), icon: FileText, color: 'text-teal-600 bg-teal-50 border-teal-200' }
  }
  return { label: 'DOC', icon: File, color: 'text-slate-600 bg-slate-50 border-slate-200' }
}

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.jpg', '.jpeg', '.png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export default function ProjectChatPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRoomId = searchParams.get('roomId')
  const initialProjectId = searchParams.get('projectId')

  const [rooms, setRooms] = useState<ChatRoomSummary[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(initialRoomId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Attachment upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  // 1. Load User's Authorized Chat Rooms
  const loadRooms = async () => {
    try {
      const data = await getMyChatRooms()
      setRooms(data)

      // Handle projectId query param if present
      if (initialProjectId && !activeRoomId) {
        try {
          const roomByProj = await getChatRoomByProject(initialProjectId)
          if (roomByProj) {
            setActiveRoomId(roomByProj.id)
            setSearchParams({ roomId: roomByProj.id })
            return
          }
        } catch {
          // Fall back
        }
      }

      // If activeRoomId is not set, select the first room
      if (!activeRoomId && data.length > 0) {
        setActiveRoomId(data[0].id)
        setSearchParams({ roomId: data[0].id })
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err)
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    loadRooms()
  }, [])

  // 2. Initialize SignalR connection and listeners
  useEffect(() => {
    let cleanupMessage: (() => void) | undefined
    let cleanupTyping: (() => void) | undefined
    let cleanupPresence: (() => void) | undefined
    let cleanupActivity: (() => void) | undefined
    let cleanupAttachment: (() => void) | undefined

    async function initSignalR() {
      await chatHub.start()

      // Handle new incoming message (including attachment messages)
      cleanupMessage = chatHub.onReceiveMessage((newMsg: ChatMessage) => {
        setMessages(prev => {
          // Avoid duplicate messages
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, isMine: newMsg.senderUserId === user?.id }]
        })

        // Update room snippet and unread count in room list
        setRooms(prevRooms =>
          prevRooms.map(r => {
            if (r.id === newMsg.chatRoomId) {
              const isCurrentRoom = r.id === activeRoomId
              return {
                ...r,
                lastMessage: newMsg,
                unreadCount: isCurrentRoom ? 0 : r.unreadCount + 1
              }
            }
            return r
          })
        )

        scrollToBottom()
      })

      // Handle dedicated attachment event (ensures attachment details update if needed)
      cleanupAttachment = chatHub.onReceiveAttachment((att: ChatAttachmentInfo) => {
        setMessages(prev =>
          prev.map(m => {
            if (m.attachmentId === att.id || (m.messageType === 'Attachment' && m.messageContent === att.originalFileName && !m.attachment)) {
              return { ...m, attachment: att }
            }
            return m
          })
        )
      })

      // Handle typing status
      cleanupTyping = chatHub.onUserTyping(data => {
        if (data.roomId === activeRoomId && data.userId !== user?.id) {
          if (data.isTyping) {
            setTypingUsers(prev => (prev.includes(data.userId) ? prev : [...prev, data.userId]))
          } else {
            setTypingUsers(prev => prev.filter(id => id !== data.userId))
          }
        }
      })

      // Handle online presence changes
      cleanupPresence = chatHub.onUserPresenceChanged(data => {
        setRooms(prevRooms =>
          prevRooms.map(r => ({
            ...r,
            participants: r.participants.map(p =>
              p.userId === data.userId ? { ...p, isOnline: data.isOnline } : p
            )
          }))
        )
      })

      // Handle background room activity updates
      cleanupActivity = chatHub.onRoomActivityUpdate(data => {
        setRooms(prevRooms =>
          prevRooms.map(r =>
            r.id === data.roomId
              ? {
                  ...r,
                  lastMessage: data.lastMessage,
                  unreadCount: r.id === activeRoomId ? 0 : r.unreadCount + 1
                }
              : r
          )
        )
      })
    }

    initSignalR()

    return () => {
      cleanupMessage?.()
      cleanupAttachment?.()
      cleanupTyping?.()
      cleanupPresence?.()
      cleanupActivity?.()
    }
  }, [activeRoomId, user?.id])

  // 3. Switch Active Room & Load Messages
  useEffect(() => {
    if (!activeRoomId) return

    let isMounted = true
    setLoadingMessages(true)

    // Clear any previous file selection when switching rooms
    setSelectedFile(null)
    setUploadProgress(null)
    setUploadError(null)
    setUploadSuccess(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    async function switchRoom() {
      try {
        await chatHub.joinRoom(activeRoomId!)
        await markChatRoomRead(activeRoomId!)

        // Reset unread count locally
        setRooms(prev =>
          prev.map(r => (r.id === activeRoomId ? { ...r, unreadCount: 0 } : r))
        )

        const msgs = await getChatRoomMessages(activeRoomId!)
        if (isMounted) {
          setMessages(msgs.map(m => ({ ...m, isMine: m.senderUserId === user?.id })))
          setTimeout(() => scrollToBottom(false), 100)
        }
      } catch (err) {
        console.error('Failed to load messages for room:', err)
      } finally {
        if (isMounted) setLoadingMessages(false)
      }
    }

    switchRoom()

    return () => {
      isMounted = false
      chatHub.leaveRoom(activeRoomId)
    }
  }, [activeRoomId, user?.id])

  // Scroll on message list updates
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // File selection & validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setUploadSuccess(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size === 0) {
      setUploadError('Selected file is empty.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`File type "${ext}" is not supported. Supported: PDF, Word, Excel, PowerPoint, Text, CSV, and Images (JPG, PNG).`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed size of 10 MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setUploadProgress(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 4. Send Message / Attachment Handler
  const handleSendMessage = async () => {
    if (!activeRoomId || sending || uploading) return

    // Case A: File Attachment Selected
    if (selectedFile) {
      setUploading(true)
      setUploadProgress(0)
      setUploadError(null)
      try {
        const uploadResult = await uploadChatAttachment(activeRoomId, selectedFile, percent => {
          setUploadProgress(percent)
        })

        setUploadSuccess(`Attachment "${selectedFile.name}" shared successfully.`)
        setTimeout(() => setUploadSuccess(null), 4000)

        // Add message locally if not already received via SignalR
        if (uploadResult.chatMessage) {
          setMessages(prev => {
            if (prev.some(m => m.id === uploadResult.chatMessage.id)) return prev
            return [...prev, { ...uploadResult.chatMessage, isMine: true }]
          })
        }

        handleRemoveSelectedFile()

        // If user also typed accompanying text, send it as a follow-up text message
        const text = inputText.trim()
        if (text) {
          try {
            await chatHub.sendMessage(activeRoomId, text)
          } catch {
            await sendChatMessage(activeRoomId, { content: text })
          }
          setInputText('')
          chatHub.sendTyping(activeRoomId, false)
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to upload attachment.')
      } finally {
        setUploading(false)
        setUploadProgress(null)
      }
      return
    }

    // Case B: Regular Text Message
    const text = inputText.trim()
    if (!text) return

    setSending(true)
    try {
      // First attempt fast real-time SignalR send
      try {
        await chatHub.sendMessage(activeRoomId, text)
      } catch {
        // Fall back to REST API
        await sendChatMessage(activeRoomId, { content: text })
      }

      setInputText('')
      chatHub.sendTyping(activeRoomId, false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (val: string) => {
    setInputText(val)
    if (!activeRoomId) return

    chatHub.sendTyping(activeRoomId, true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      chatHub.sendTyping(activeRoomId, false)
    }, 2000)
  }

  const activeRoom = rooms.find(r => r.id === activeRoomId)
  const filteredRooms = rooms.filter(r => {
    const q = searchQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.projectCode && r.projectCode.toLowerCase().includes(q)) ||
      (r.departmentName && r.departmentName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Project Collaboration Channel
            </span>
            <span className="text-xs text-slate-500">• Authorized Project Collaboration & File Sharing</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
            Inter-Departmental Project Chat
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SignalR Active</span>
          </div>
        </div>
      </div>

      {/* Main Split: Sidebar + Chat Window */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Project Rooms List */}
        <aside className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
          {/* Room Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project chat rooms..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingRooms ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Loading active project channels...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold text-slate-600">No project chat rooms found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dedicated rooms are created automatically when a Digital Lab Supervisor accepts an assignment.
                </p>
              </div>
            ) : (
              filteredRooms.map(r => {
                const isSelected = r.id === activeRoomId
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRoomId(r.id)
                      setSearchParams({ roomId: r.id })
                    }}
                    className={`w-full p-4 text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                        {r.projectCode ?? 'PROJECT'}
                      </span>
                      {r.lastMessage && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.lastMessage.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-900 truncate">{r.projectTitle ?? r.title}</p>

                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                      <p className="truncate line-clamp-1 max-w-[220px]">
                        {r.lastMessage ? (
                          <>
                            <span className="font-semibold text-slate-700">
                              {r.lastMessage.senderName.split(' ')[0]}:
                            </span>{' '}
                            {r.lastMessage.messageType === 'Attachment' ? (
                              <span className="text-blue-700 font-semibold inline-flex items-center gap-1">
                                <Paperclip className="w-3 h-3 inline" />
                                {r.lastMessage.messageContent}
                              </span>
                            ) : (
                              r.lastMessage.messageContent
                            )}
                          </>
                        ) : (
                          <span className="italic text-slate-400">No messages yet</span>
                        )}
                      </p>

                      {r.unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs shrink-0">
                          {r.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Participant indicators */}
                    <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-slate-100">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-500">
                        {r.participants.length} authorized participants
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {r.participants.filter(p => p.isOnline).length} online
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Center/Right: Active Chat Conversation */}
        <main className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {activeRoom ? (
            <>
              {/* Active Room Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {activeRoom.projectCode}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {activeRoom.departmentName}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                    {activeRoom.projectTitle ?? activeRoom.title}
                  </h2>
                </div>

                {/* 3 Authorized Participants Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Channel Members:
                  </span>
                  {activeRoom.participants.map(p => {
                    const pill = getRolePill(p.role)
                    return (
                      <div
                        key={p.userId}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs"
                      >
                        <div className="relative">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                            {p.fullName.charAt(0)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white ${
                              p.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[100px]">
                          {p.fullName.split(' ')[0]}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${pill.bg} border`}
                        >
                          {pill.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Security notice */}
                <div className="max-w-md mx-auto p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-center text-[11px] text-blue-900 flex items-center justify-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>
                    Secured project room. Files and messages are restricted exclusively to DGM, Project Requester, and Assigned Supervisor.
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="py-20 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading message history...</span>
                  </div>
                ) : (
                  messages.map(msg => {
                    if (msg.messageType === 'System') {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="max-w-xl px-4 py-2 rounded-full bg-slate-200/70 border border-slate-300/70 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>{msg.messageContent}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-1">
                              {new Date(msg.sentAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      )
                    }

                    const isMine = msg.isMine
                    const rolePill = getRolePill(msg.senderRole)

                    // Case: Attachment Message
                    if (msg.messageType === 'Attachment') {
                      const originalName = msg.attachment?.originalFileName || msg.messageContent || 'Document'
                      const ext = msg.attachment?.fileExtension || ('.' + (originalName.split('.').pop() || '').toLowerCase())
                      const badge = getFileBadge(ext)
                      const BadgeIcon = badge.icon
                      const fileSize = msg.attachment?.fileSize ? formatFileSize(msg.attachment.fileSize) : 'Attachment'
                      const canView = msg.attachment?.canViewInline ?? ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMine && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {msg.senderName.charAt(0)}
                            </div>
                          )}

                          <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            {!isMine && (
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-xs font-bold text-slate-900">
                                  {msg.senderName}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${rolePill.bg} border`}
                                >
                                  {rolePill.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(msg.sentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}

                            {/* Attachment Card */}
                            <div
                              className={`p-4 rounded-2xl text-xs max-w-sm sm:max-w-md ${
                                isMine
                                  ? 'bg-blue-800 text-white shadow-sm rounded-tr-xs'
                                  : 'bg-white border border-slate-200 text-slate-900 shadow-2xs rounded-tl-xs'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                                    isMine ? 'bg-blue-700/80 border-blue-500/60 text-white' : badge.color
                                  }`}
                                >
                                  <BadgeIcon className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                                        isMine
                                          ? 'bg-blue-900/60 border-blue-400/40 text-blue-100'
                                          : badge.color
                                      }`}
                                    >
                                      {badge.label}
                                    </span>
                                    <span
                                      className={`text-[10px] font-mono ${
                                        isMine ? 'text-blue-200' : 'text-slate-500'
                                      }`}
                                    >
                                      {fileSize}
                                    </span>
                                  </div>

                                  <p
                                    className={`font-bold text-xs truncate ${
                                      isMine ? 'text-white' : 'text-slate-900'
                                    }`}
                                    title={originalName}
                                  >
                                    {originalName}
                                  </p>

                                  {/* Download and View buttons */}
                                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100/20">
                                    {canView && msg.attachment?.id && (
                                      <button
                                        type="button"
                                        onClick={() => viewChatAttachmentInline(msg.attachment!.id)}
                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                          isMine
                                            ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                        }`}
                                        title="View document inline"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </button>
                                    )}

                                    {msg.attachment?.id && (
                                      <button
                                        type="button"
                                        onClick={() => downloadChatAttachment(msg.attachment!.id, originalName)}
                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                          isMine
                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                        }`}
                                        title="Download file"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isMine && (
                              <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">
                                {new Date(msg.sentAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}{' '}
                                • Attachment Sent
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    }

                    // Case: Standard Text Message
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {msg.senderName.charAt(0)}
                          </div>
                        )}

                        <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          {!isMine && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-xs font-bold text-slate-900">
                                {msg.senderName}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${rolePill.bg} border`}
                              >
                                {rolePill.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(msg.sentAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                              isMine
                                ? 'bg-blue-700 text-white shadow-sm rounded-tr-xs'
                                : 'bg-white border border-slate-200 text-slate-900 shadow-2xs rounded-tl-xs'
                            }`}
                          >
                            {msg.messageContent}
                          </div>

                          {isMine && (
                            <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">
                              {new Date(msg.sentAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}{' '}
                              • Sent
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Real-time typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 italic px-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Participant is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Toolbar */}
              <div className="bg-white border-t border-slate-200 p-4">
                {/* Selected File Preview Banner */}
                {selectedFile && (
                  <div className="mb-3 p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {formatFileSize(selectedFile.size)} • Ready to upload
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {uploading ? (
                        <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold px-2 py-1 bg-blue-100 rounded-lg">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{uploadProgress !== null ? `${uploadProgress}%` : 'Uploading...'}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRemoveSelectedFile}
                          className="p-1 rounded-lg hover:bg-blue-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Remove attachment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-rose-800 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="p-1 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Upload Success Banner */}
                {uploadSuccess && (
                  <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                />

                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-2 bg-slate-50 border border-slate-300/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 transition">
                    {/* Attachment '+' Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-100/70 border border-slate-200 transition cursor-pointer disabled:opacity-50 shrink-0 mb-0.5"
                      title="Attach Document or Image (PDF, Word, Excel, PPT, Text, CSV, Images - Max 10MB)"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <textarea
                      rows={2}
                      placeholder={selectedFile ? "Add a message with this attachment (optional)..." : "Type your message here... (Enter to send, Shift+Enter for newline)"}
                      value={inputText}
                      maxLength={2000}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-0 text-xs text-slate-900 focus:outline-none resize-none p-1 placeholder:text-slate-400"
                    />

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={(!inputText.trim() && !selectedFile) || sending || uploading}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:cursor-not-allowed shrink-0 mb-0.5"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : selectedFile ? (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Upload & Send</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{sending ? 'Sending...' : 'Send'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span>
                      Supported: PDF, Word, Excel, PPT, Text, CSV, Images (Max 10 MB per file).
                    </span>
                    <span>{inputText.length} / 2000</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">Select a Project Chat Room</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose an active collaboration room from the left sidebar to communicate directly with the DGM, Requester, and Digital Lab Supervisor.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
