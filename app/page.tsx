'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getSessionId, getPlayerName, setPlayerName } from '@/lib/cardUtils'
import styles from './page.module.css'

export default function Home() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [savedName, setSavedName] = useState<string | null>(null)

  const createRoom = useMutation(api.rooms.createRoom)
  const joinRoom = useMutation(api.rooms.joinRoom)

  useEffect(() => {
    const existing = getPlayerName()
    if (existing) {
      setSavedName(existing)
      setName(existing)
    }
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) { setError('Enter a name'); return }
    setIsLoading(true)
    setError(null)
    try {
      setPlayerName(name.trim())
      const { roomCode: code } = await createRoom({
        name: name.trim(),
        sessionId: getSessionId(),
      })
      window.location.href = `/room/${code}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Enter a name'); return }
    if (!roomCode.trim()) { setError('Enter a room code'); return }
    setIsLoading(true)
    setError(null)
    try {
      setPlayerName(name.trim())
      await joinRoom({
        roomCode: roomCode.trim().toUpperCase(),
        name: name.trim(),
        sessionId: getSessionId(),
      })
      window.location.href = `/room/${roomCode.trim().toUpperCase()}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Tractor 升级</h1>
        <p className={styles.subtitle}>4-player trick-taking card game</p>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                if (e.target.value.length <= 6) {
                  setName(e.target.value)
                  setError(null)
                }
              }}
              placeholder="Your name (max 6)"
              className={styles.input}
              maxLength={6}
              disabled={isLoading}
              autoFocus
            />
            <span className={styles.charCount}>{name.length}/6</span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.button}
            onClick={handleCreate}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Loading...' : 'Create Room'}
          </button>

          <div className={styles.divider}>
            <span>or join existing</span>
          </div>

          <form onSubmit={handleJoin} className={styles.joinForm}>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="Room code"
              className={styles.input}
              maxLength={4}
              disabled={isLoading}
              style={{ textAlign: 'center', letterSpacing: '0.3em' }}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={isLoading || !name.trim() || roomCode.length < 4}
              style={{ background: '#555' }}
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
