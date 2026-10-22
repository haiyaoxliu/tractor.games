'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getSessionId, getPlayerName, setPlayerName } from '@/lib/cardUtils'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createRoom = useMutation(api.rooms.createRoom)
  const joinRoom = useMutation(api.rooms.joinRoom)

  useEffect(() => {
    const existing = getPlayerName()?.slice(0, 6)
    if (existing) {
      // localStorage is unavailable during SSR, so the saved name can only be
      // applied after hydration
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(existing)
    }
  }, [])

  const handleCreate = async (gameType: "tractor" | "hearts" | "wizard" | "skullking") => {
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
      router.push(`/room/${code}`)
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
      router.push(`/room/${roomCode.trim().toUpperCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }

  const games: {
    type: "tractor" | "hearts" | "wizard" | "skullking"
    title: string
    players: string
    desc: string
  }[] = [
    {
      type: "tractor",
      title: "Tractor 升级",
      players: "4 players",
      desc: "Team-based trick-taking with trump declaration, kitty, and rank progression.",
    },
    {
      type: "hearts",
      title: "Gong Zhu 拱猪",
      players: "4 players",
      desc: "Trick avoidance with Gong Zhu scoring: dodge hearts, the pig 猪, and the doubler.",
    },
    {
      type: "wizard",
      title: "Wizard",
      players: "3–6 players",
      desc: "Predict your exact trick count each round — wizards beat all, jesters beat none.",
    },
    {
      type: "skullking",
      title: "Skull King",
      players: "3–6 players",
      desc: "Pirate-themed exact bidding: mermaids sink the Skull King, the Skull King sinks pirates.",
    },
  ]

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          <span className={styles.titleSuits}>♠♥♦♣</span> Card Games
        </h1>
        <p className={styles.subtitle}>Trick-taking games to play with friends</p>

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
            {games.map((g) => (
              <div key={g.type} className={styles.gameTile}>
                <h3 className={styles.gameTileTitle}>{g.title}</h3>
                <div className={styles.gameTilePlayers}>{g.players}</div>
                <p className={styles.gameTileDesc}>{g.desc}</p>
                <button
                  className={styles.button}
                  onClick={() => handleCreate(g.type)}
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? 'Loading...' : 'Create Room'}
                </button>
              </div>
            ))}
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
              style={{ background: 'var(--legacy-gray-555)' }}
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
