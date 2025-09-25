import { createSignal, createMemo, createEffect } from 'solid-js'
import { check, when, every, whenEffect, whenMemo } from '@bigmistqke/solid-whenever'

export function BasicUsageExample() {
  const [user, setUser] = createSignal<{ name: string; age: number } | null>(null)
  const [settings, setSettings] = createSignal<{ theme: string } | null>(null)

  // Example 1: Using check for immediate conditional execution
  const userName = check(
    user,
    (u) => u.name,
    () => 'Anonymous'
  )

  // Example 2: Using when with createMemo for reactive values
  const greeting = createMemo(
    when(
      user,
      (u) => `Hello, ${u.name}! You are ${u.age} years old.`,
      () => 'Please log in to see your greeting.'
    )
  )

  // Example 3: Using every to compose multiple conditions
  const userProfile = createMemo(
    when(every(user, settings), ([u, s]) => ({
      name: u.name,
      age: u.age,
      theme: s.theme,
      displayName: `${u.name} (${s.theme} theme)`
    }))
  )

  // Example 4: Using whenEffect for side effects
  whenEffect(user, (u) => {
    console.log(`User ${u.name} logged in at`, new Date())
    // Trigger analytics, setup subscriptions, etc.
  })

  // Example 5: Using whenMemo for expensive computations
  const expensiveUserData = whenMemo(user, (u) => {
    console.log('Computing expensive user data...')
    // Simulate expensive computation
    return {
      ...u,
      slug: u.name.toLowerCase().replace(/\s+/g, '-'),
      initials: u.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      isAdult: u.age >= 18
    }
  })

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>solid-whenever Examples</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>User State</h2>
        <p><strong>Name:</strong> {userName}</p>
        <p><strong>Greeting:</strong> {greeting()}</p>
        
        {userProfile() && (
          <div>
            <h3>Profile</h3>
            <p><strong>Display Name:</strong> {userProfile()!.displayName}</p>
            <p><strong>Theme:</strong> {userProfile()!.theme}</p>
          </div>
        )}

        {expensiveUserData() && (
          <div>
            <h3>Computed Data</h3>
            <p><strong>Slug:</strong> {expensiveUserData()!.slug}</p>
            <p><strong>Initials:</strong> {expensiveUserData()!.initials}</p>
            <p><strong>Is Adult:</strong> {expensiveUserData()!.isAdult ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Controls</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => setUser({ name: 'John Doe', age: 25 })}>
            Login as John
          </button>
          <button onClick={() => setUser({ name: 'Jane Smith', age: 17 })}>
            Login as Jane
          </button>
          <button onClick={() => setUser(null)}>
            Logout
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setSettings({ theme: 'dark' })}
            disabled={!user()}
          >
            Set Dark Theme
          </button>
          <button 
            onClick={() => setSettings({ theme: 'light' })}
            disabled={!user()}
          >
            Set Light Theme
          </button>
          <button onClick={() => setSettings(null)}>
            Clear Settings
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Code Examples</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`
// Basic check usage
const userName = check(user, u => u.name, () => 'Anonymous')

// Reactive memo with when
const greeting = createMemo(
  when(user, u => \`Hello, \${u.name}!\`, () => 'Please log in')
)

// Multiple conditions with every
const profile = createMemo(
  when(every(user, settings), ([u, s]) => ({
    name: u.name,
    theme: s.theme
  }))
)

// Side effects with whenEffect
whenEffect(user, u => {
  console.log(\`User \${u.name} logged in\`)
})

// Memoized expensive computations
const expensiveData = whenMemo(user, u => {
  return computeExpensiveUserData(u)
})
        `}</pre>
      </div>
    </div>
  )
}