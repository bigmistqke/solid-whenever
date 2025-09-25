import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { check, every, when, whenComputed, whenEffect, whenMemo, whenRenderEffect } from '../src'
import styles from './App.module.css'

const App: Component = () => {
  const [user, setUser] = createSignal<{ name: string; age: number } | null>(null)
  const [settings, setSettings] = createSignal<{ theme: string } | null>(null)
  const [isOnline, setIsOnline] = createSignal(false)
  const [element, setElement] = createSignal<HTMLDivElement>()

  // createMemo(when(...))
  const greeting = createMemo(
    when(
      user,
      u => `Hello, ${u.name}! (age: ${u.age})`,
      () => 'Please log in',
    ),
  )

  // createMemo(when(every(...)))
  const userStatus = createMemo(
    when(
      every(user, settings, isOnline),
      ([user, settings]) => `${user.name} is online with ${settings.theme} theme`,
    ),
  )

  // createEffect(when(...))
  createEffect(
    when(user, user => {
      console.log(`[createEffect + when] User logged in: ${user.name}`)
    }),
  )

  // createEffect(() => ... check(user(), user => ...))
  createEffect(() => {
    const userName = check(
      user,
      user => {
        console.log(`[createEffect + check] Processing user: ${user.name}`)
        return user.name
      },
      () => {
        console.log(`[createEffect + check] No user to process: returning 'undefined'`)
        return 'undefined'
      },
    )
    console.log(`[createEffect + check] Resulting user-name: ${userName}`)
  })

  // All the solid wrappers:

  // whenEffect with fallback
  whenEffect(
    user,
    user => {
      console.log(`[whenEffect] Welcome ${user.name}!`)
    },
    () => {
      console.log('[whenEffect fallback] No user logged in')
    },
  )

  // whenRenderEffect with fallback
  whenRenderEffect(element, element => {
    whenRenderEffect(
      isOnline,
      () => {
        element.style.backgroundColor = '#d4f6d4'
        element.style.borderColor = '#28a745'
        console.log('[whenRenderEffect] Styled online indicator')
      },
      () => {
        element.style.backgroundColor = ''
        element.style.borderColor = ''
        console.log('[whenRenderEffect] Styled online indicator')
      },
    )
  })

  // whenComputed with fallback
  whenComputed(
    settings,
    s => {
      console.log(`[whenComputed] Theme changed to: ${s.theme}`)
    },
    () => {
      console.log('[whenComputed fallback] No theme settings available')
    },
  )

  // whenMemo with fallback
  const userDataMemo = whenMemo(
    user,
    user => {
      return {
        slug: user.name.toLowerCase().replace(/\s+/g, '-'),
        initials: user.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase(),
      }
    },
    () => {
      console.log('[whenMemo fallback] No user data to compute')
      return { slug: 'anonymous', initials: '?' }
    },
  )

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>solid-whenever</h1>

        <div style={{ 'max-width': '600px', margin: '0 auto', 'text-align': 'left' }}>
          <div
            style={{
              padding: '20px',
              border: '2px solid #ccc',
              'border-radius': '8px',
              'margin-bottom': '20px',
            }}
          >
            <h3>Current State</h3>
            <p>
              <strong>1. createMemo(when()):</strong> {greeting()}
            </p>
            <p>
              <strong>2. createMemo(when(every())):</strong> {userStatus() || 'Incomplete state'}
            </p>
            <div
              ref={setElement}
              style={{
                padding: '10px',
                'border-radius': '4px',
                border: '2px solid #ddd',
                transition: 'all 0.3s',
                'margin-top': '10px',
              }}
            >
              <strong>Online Status:</strong> {isOnline() ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div
              style={{
                'margin-top': '10px',
                padding: '10px',
                border: '2px solid #f8f9fa',
                'border-radius': '4px',
              }}
            >
              <strong>whenMemo result:</strong>
              <br />
              Slug: {userDataMemo().slug}
              <br />
              Initials: {userDataMemo().initials}
            </div>
          </div>

          <div
            style={{ display: 'flex', gap: '10px', 'flex-wrap': 'wrap', 'margin-bottom': '20px' }}
          >
            <button onClick={() => setUser({ name: 'Alice Smith', age: 25 })}>Login Alice</button>
            <button onClick={() => setUser({ name: 'Bob Jones', age: 30 })}>Login Bob</button>
            <button onClick={() => setUser(null)}>Logout</button>
          </div>

          <div
            style={{ display: 'flex', gap: '10px', 'flex-wrap': 'wrap', 'margin-bottom': '20px' }}
          >
            <button onClick={() => setSettings({ theme: 'dark' })} disabled={!user()}>
              Dark Theme
            </button>
            <button onClick={() => setSettings({ theme: 'light' })} disabled={!user()}>
              Light Theme
            </button>
            <button onClick={() => setSettings(null)}>Clear Settings</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', 'flex-wrap': 'wrap' }}>
            <button onClick={() => setIsOnline(o => !o)}>
              Toggle Online ({isOnline() ? 'ON' : 'OFF'})
            </button>
          </div>

          <div
            style={{
              'margin-top': '30px',
              padding: '15px',
              'background-color': '#e7f3ff',
              'border-radius': '5px',
            }}
          >
            <h4>📋 Demo Order (check console logs):</h4>
            <ol style={{ margin: '10px 0', 'padding-left': '20px', 'font-size': '14px' }}>
              <li>
                <code>createMemo(when(user, ...))</code> - Basic conditional memo
              </li>
              <li>
                <code>createMemo(when(every(user, settings, online), ...))</code> - Multi-condition
                memo
              </li>
              <li>
                <code>createEffect(when(user, ...))</code> - Conditional effect
              </li>
              <li>
                <code>createEffect(() ={'>'} check(user(), ...))</code> - Effect with check
              </li>
              <li>
                <code>whenEffect</code> - Effect wrapper with fallback logging
              </li>
              <li>
                <code>whenRenderEffect</code> - DOM effect with fallback logging
              </li>
              <li>
                <code>whenComputed</code> - Computed wrapper with fallback logging
              </li>
              <li>
                <code>whenMemo</code> - Memo wrapper with fallback data
              </li>
            </ol>
          </div>
        </div>
      </header>
    </div>
  )
}

export default App
