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

  const handleCreate = async (gameType: "tractor" | "hearts" | "werewolf") => {
    if (!name.trim()) { setError('Enter a name'); return }
    setIsLoading(true)
    setError(null)
    try {
      setPlayerName(name.trim())
      const { roomCode: code } = await createRoom({
        name: name.trim(),
        sessionId: getSessionId(),
        gameType,
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
        <h1 className={styles.title}>Card Games</h1>
        <p className={styles.subtitle}>Card games and party games with friends</p>

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

          <div className={styles.gameGrid}>
            <div className={styles.gameTile}>
              <h3 className={styles.gameTileTitle}>Tractor 升级</h3>
              <p className={styles.gameTileDesc}>Team-based trick-taking with trump declaration, kitty, and rank progression.</p>
              <button
                className={styles.button}
                onClick={() => handleCreate("tractor")}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Loading...' : 'Create Room'}
              </button>
            </div>
            <div className={styles.gameTile}>
              <h3 className={styles.gameTileTitle}>Hearts 拱猪</h3>
              <p className={styles.gameTileDesc}>Free-for-all trick avoidance with Gong Zhu scoring: dodge hearts, QD, and the TC multiplier.</p>
              <button
                className={styles.button}
                onClick={() => handleCreate("hearts")}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Loading...' : 'Create Room'}
              </button>
            </div>
            <div className={styles.gameTile}>
              <h3 className={styles.gameTileTitle}>Werewolf 狼人杀</h3>
              <p className={styles.gameTileDesc}>One Night social deduction for 5-16 players. Roles, night actions, discussion, and voting.</p>
              <button
                className={styles.button}
                onClick={() => handleCreate("werewolf")}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Loading...' : 'Create Room'}
              </button>
            </div>
          </div>

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
