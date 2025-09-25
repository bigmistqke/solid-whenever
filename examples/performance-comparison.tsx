import { createSignal, createMemo, createEffect } from 'solid-js'
import { when, every, whenMemo } from '@bigmistqke/solid-whenever'

export function PerformanceComparison() {
  const [user, setUser] = createSignal<{ id: number; name: string; posts: any[] } | null>(null)
  const [settings, setSettings] = createSignal<{ showStats: boolean } | null>(null)

  // WITHOUT solid-whenever (traditional approach)
  const traditionalStats = createMemo(() => {
    const currentUser = user()
    const currentSettings = settings()
    
    if (!currentUser || !currentSettings || !currentSettings.showStats) {
      return undefined
    }
    
    // Expensive computation that runs even when we don't need it
    console.log('Traditional: Computing expensive stats...')
    return {
      totalPosts: currentUser.posts.length,
      avgPostLength: currentUser.posts.reduce((acc, p) => acc + p.content.length, 0) / currentUser.posts.length,
      recentPosts: currentUser.posts.slice(-5)
    }
  })

  // WITH solid-whenever (optimized approach)
  const optimizedStats = createMemo(
    when(
      every(user, () => settings()?.showStats),
      ([currentUser]) => {
        // Only runs when both user exists AND showStats is true
        console.log('Optimized: Computing expensive stats...')
        return {
          totalPosts: currentUser.posts.length,
          avgPostLength: currentUser.posts.reduce((acc, p) => acc + p.content.length, 0) / currentUser.posts.length,
          recentPosts: currentUser.posts.slice(-5)
        }
      }
    )
  )

  // Even better: Use whenMemo to avoid creating the memo when not needed
  const superOptimizedStats = whenMemo(
    () => user() && settings()?.showStats ? user() : null,
    (currentUser) => {
      console.log('Super optimized: Computing expensive stats...')
      return {
        totalPosts: currentUser.posts.length,
        avgPostLength: currentUser.posts.reduce((acc, p) => acc + p.content.length, 0) / currentUser.posts.length,
        recentPosts: currentUser.posts.slice(-5)
      }
    }
  )

  // Track computation count
  const [traditionalCount, setTraditionalCount] = createSignal(0)
  const [optimizedCount, setOptimizedCount] = createSignal(0)
  const [superOptimizedCount, setSuperOptimizedCount] = createSignal(0)

  createEffect(() => {
    if (traditionalStats()) {
      setTraditionalCount(c => c + 1)
    }
  })

  createEffect(() => {
    if (optimizedStats()) {
      setOptimizedCount(c => c + 1)
    }
  })

  createEffect(() => {
    if (superOptimizedStats()) {
      setSuperOptimizedCount(c => c + 1)
    }
  })

  const mockUser = {
    id: 1,
    name: 'John Doe',
    posts: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      content: `This is post number ${i} with some content that varies in length. `.repeat(Math.floor(Math.random() * 10) + 1)
    }))
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Performance Comparison</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Controls</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => setUser(mockUser)}>
            Set User (with 100 posts)
          </button>
          <button onClick={() => setUser(null)}>
            Clear User
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setSettings({ showStats: true })}>
            Enable Stats
          </button>
          <button onClick={() => setSettings({ showStats: false })}>
            Disable Stats
          </button>
          <button onClick={() => setSettings(null)}>
            Clear Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '15px', border: '2px solid #ff6b6b', borderRadius: '8px' }}>
          <h3>❌ Traditional Approach</h3>
          <p><strong>Computations:</strong> {traditionalCount()}</p>
          <p><strong>Stats:</strong> {traditionalStats() ? 'Computed' : 'Not available'}</p>
          {traditionalStats() && (
            <div>
              <p>Total Posts: {traditionalStats()!.totalPosts}</p>
              <p>Avg Length: {Math.round(traditionalStats()!.avgPostLength)}</p>
            </div>
          )}
          <pre style={{ fontSize: '10px', backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`const stats = createMemo(() => {
  const user = user()
  const settings = settings()
  
  // Runs every time either changes
  if (!user || !settings?.showStats) {
    return undefined
  }
  
  return expensiveComputation(user)
})`}
          </pre>
        </div>

        <div style={{ padding: '15px', border: '2px solid #4ecdc4', borderRadius: '8px' }}>
          <h3>✅ With solid-whenever</h3>
          <p><strong>Computations:</strong> {optimizedCount()}</p>
          <p><strong>Stats:</strong> {optimizedStats() ? 'Computed' : 'Not available'}</p>
          {optimizedStats() && (
            <div>
              <p>Total Posts: {optimizedStats()!.totalPosts}</p>
              <p>Avg Length: {Math.round(optimizedStats()!.avgPostLength)}</p>
            </div>
          )}
          <pre style={{ fontSize: '10px', backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`const stats = createMemo(
  when(
    every(user, () => settings()?.showStats),
    ([user]) => {
      // Only runs when both conditions are met
      return expensiveComputation(user)
    }
  )
)`}
          </pre>
        </div>

        <div style={{ padding: '15px', border: '2px solid #45b7d1', borderRadius: '8px' }}>
          <h3>🚀 Super Optimized</h3>
          <p><strong>Computations:</strong> {superOptimizedCount()}</p>
          <p><strong>Stats:</strong> {superOptimizedStats() ? 'Computed' : 'Not available'}</p>
          {superOptimizedStats() && (
            <div>
              <p>Total Posts: {superOptimizedStats()!.totalPosts}</p>
              <p>Avg Length: {Math.round(superOptimizedStats()!.avgPostLength)}</p>
            </div>
          )}
          <pre style={{ fontSize: '10px', backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`const stats = whenMemo(
  () => user() && settings()?.showStats ? user() : null,
  (user) => {
    // Memo only exists when needed
    return expensiveComputation(user)
  }
)`}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
        <h3>📊 Performance Notes</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Traditional:</strong> Runs expensive computation even when result isn't needed</li>
          <li><strong>With solid-whenever:</strong> Only computes when all conditions are met</li>
          <li><strong>Super Optimized:</strong> Doesn't even create the memo until needed</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', fontStyle: 'italic' }}>
          Open your browser's console to see when computations actually run!
        </p>
      </div>
    </div>
  )
}