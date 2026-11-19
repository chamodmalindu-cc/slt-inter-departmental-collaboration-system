import * as signalR from '@microsoft/signalr'
import type { ChatMessage, ChatAttachmentInfo } from '../types/auth'

class ChatHubService {
  private connection: signalR.HubConnection | null = null
  private startPromise: Promise<void> | null = null

  public getConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/chat', {
          accessTokenFactory: () => localStorage.getItem('slt_token') || '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Information)
        .build()

      // Reset start promise on closed
      this.connection.onclose(() => {
        this.startPromise = null
      })
    }
    return this.connection
  }

  public async start(): Promise<void> {
    const conn = this.getConnection()
    if (conn.state === signalR.HubConnectionState.Connected) {
      return
    }

    if (this.startPromise) {
      return this.startPromise
    }

    this.startPromise = (async () => {
      try {
        if (conn.state === signalR.HubConnectionState.Disconnected) {
          await conn.start()
        }
      } catch (err) {
        console.warn('SignalR chat hub connection failed (will retry):', err)
        throw err
      } finally {
        this.startPromise = null
      }
    })()

    return this.startPromise
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop().catch(() => {})
      this.connection = null
      this.startPromise = null
    }
  }

  public async joinRoom(roomId: string): Promise<void> {
    try {
      await this.start()
      const conn = this.getConnection()
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('JoinRoom', roomId)
      }
    } catch (err) {
      console.warn(`SignalR joinRoom(${roomId}) warning:`, err)
    }
  }

  public async leaveRoom(roomId: string): Promise<void> {
    const conn = this.getConnection()
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke('LeaveRoom', roomId).catch(() => {})
    }
  }

  public async sendMessage(roomId: string, content: string): Promise<void> {
    await this.start()
    const conn = this.getConnection()
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke('SendMessage', roomId, content)
    } else {
      throw new Error('Chat connection is not active.')
    }
  }

  public async sendTyping(roomId: string, isTyping: boolean): Promise<void> {
    try {
      const conn = this.getConnection()
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('SendTyping', roomId, isTyping).catch(() => {})
      }
    } catch {
      // Non-critical
    }
  }

  public async markRoomAsRead(roomId: string): Promise<void> {
    try {
      const conn = this.getConnection()
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('MarkRoomAsRead', roomId).catch(() => {})
      }
    } catch {
      // Non-critical
    }
  }

  public onReceiveMessage(callback: (msg: ChatMessage) => void): () => void {
    const conn = this.getConnection()
    conn.on('ReceiveMessage', callback)
    return () => conn.off('ReceiveMessage', callback)
  }

  public onUserTyping(callback: (data: { roomId: string; userId: string; isTyping: boolean }) => void): () => void {
    const conn = this.getConnection()
    conn.on('UserTyping', callback)
    return () => conn.off('UserTyping', callback)
  }

  public onUserPresenceChanged(callback: (data: { userId: string; isOnline: boolean }) => void): () => void {
    const conn = this.getConnection()
    conn.on('UserPresenceChanged', callback)
    return () => conn.off('UserPresenceChanged', callback)
  }

  public onRoomActivityUpdate(callback: (data: { roomId: string; lastMessage: ChatMessage }) => void): () => void {
    const conn = this.getConnection()
    conn.on('RoomActivityUpdate', callback)
    return () => conn.off('RoomActivityUpdate', callback)
  }

  public onReceiveAttachment(callback: (attachment: ChatAttachmentInfo) => void): () => void {
    const conn = this.getConnection()
    conn.on('ReceiveAttachment', callback)
    return () => conn.off('ReceiveAttachment', callback)
  }
}

export const chatHub = new ChatHubService()
