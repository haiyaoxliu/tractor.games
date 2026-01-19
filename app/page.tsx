'use client'

import { useState, FormEvent } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter a name')
      return
    }

    if (name.length > 6) {
      setError('Name must be 6 characters or less')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/save-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to save name')
      }

      const data = await response.json()
      setSavedName(data.name)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome to Tractor Games</h1>
        <p className={styles.subtitle}>Enter your name to get started</p>
        
        {savedName && (
          <div className={styles.success}>
            Welcome, <strong>{savedName}</strong>!
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 6) {
                  setName(value)
                  setError(null)
                }
              }}
              placeholder="Enter name (max 6 chars)"
              className={styles.input}
              maxLength={6}
              disabled={isLoading}
              autoFocus
            />
            <span className={styles.charCount}>{name.length}/6</span>
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}
