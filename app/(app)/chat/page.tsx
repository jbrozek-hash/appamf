'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Hash, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Channel { id: string; name: string; is_general: number }
interface Message { id: string; content: string; author_name: string; author_image?: string; created_at: string }

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [addingChannel, setAddingChannel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/workspaces').then(r => r.json()).then(ws => {
      if (ws.length > 0) {
        setWorkspaceId(ws[0].id)
        fetch(`/api/channels?workspaceId=${ws[0].id}`).then(r => r.json()).then(chs => {
          setChannels(chs)
          if (chs.length > 0) setActiveChannel(chs[0])
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!activeChannel) return
    const load = () => fetch(`/api/messages?channelId=${activeChannel.id}`).then(r => r.json()).then(setMessages)
    load()
    pollRef.current = setInterval(load, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeChannel?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !activeChannel) return
    const content = input.trim()
    setInput('')
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: activeChannel.id, content }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
    }
  }

  const createChannel = async () => {
    if (!newChannelName.trim() || !workspaceId) return
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name: newChannelName.trim() }),
    })
    if (res.ok) {
      const ch = await res.json()
      setChannels(prev => [...prev, ch])
      setActiveChannel(ch)
      setNewChannelName('')
      setAddingChannel(false)
    }
  }

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('pl')
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {} as Record<string, Message[]>)

  return (
    <div className="flex h-screen">
      {/* Channels sidebar */}
      <div className="w-56 bg-gray-800 text-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-200">Czat</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left',
                activeChannel?.id === ch.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              )}>
              <Hash size={14} className="flex-shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>
        <div className="px-3 py-3 border-t border-gray-700">
          {addingChannel ? (
            <div className="space-y-2">
              <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createChannel(); if (e.key === 'Escape') setAddingChannel(false) }}
                placeholder="nazwa-kanału" autoFocus
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 outline-none placeholder-gray-500" />
              <div className="flex gap-1">
                <button onClick={createChannel} className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1">Dodaj</button>
                <button onClick={() => setAddingChannel(false)} className="text-xs text-gray-400 hover:text-white px-2">✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingChannel(true)}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <Plus size={14} /> Nowy kanał
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChannel ? (
          <>
            <div className="flex items-center gap-2 px-6 py-4 border-b">
              <Hash size={16} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">{activeChannel.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 px-2">{date}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-3">
                    {msgs.map(msg => (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar name={msg.author_name} image={msg.author_image} size="md" />
                        <div>
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900">{msg.author_name}</span>
                            <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Hash size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">Brak wiadomości. Napisz pierwszą!</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="px-6 py-4 border-t">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder={`Napisz na #${activeChannel.name}...`}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
                <button onClick={send} disabled={!input.trim()}
                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Wybierz kanał aby zacząć
          </div>
        )}
      </div>
    </div>
  )
}
