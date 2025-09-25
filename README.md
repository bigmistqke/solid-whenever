<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-whenever&background=tiles&project=%20" alt="solid-whenever">
</p>

# solid-whenever

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

Working with nullable values in `solid` can cause awkward patterns with intermediary variables:

```tsx
// Without solid-whenever
const [user, setUser] = createSignal(null)
const [settings, setSettings] = createSignal(null)

createEffect(() => {
  const _user = user()
  const _settings = settings()
  if (_user && _settings) {
    console.log(_user.name, _settings.theme)
  }
})
```

With `solid-whenever`, you can keep your variable names and have cleaner code:

```tsx
// With solid-whenever
createEffect(
  when(every(user, settings), ([user, settings]) => {
    // Same names, no confusion!
    console.log(user.name, settings.theme)
  }),
)
```

## API

The library provides 3 core utilities:

- **`check`** - Conditionally execute code when a value is truthy
- **`when`** - A callback wrapper around `check`
- **`every`** - Compose multiple conditions together

Plus convenience wrappers around Solid's reactive primitives:

- **`whenEffect`**
- **`whenRenderEffect`**
- **`whenComputed`**
- **`whenMemo`**

### `check`

Immediately checks if a value is truthy and executes a callback with that value. Returns the callback result or undefined/fallback.

```tsx
import { check } from 'solid-whenever'

// Basic usage
const result = check(user(), u => u.name) // returns name if user exists

// With fallback
const name = check(
  user(),
  u => u.name,
  () => 'Anonymous',
)
```

### `when`

Returns a function that conditionally executes based on truthiness, for composition with solid's reactive primitives.

```tsx
import { when, createSignal, createMemo } from 'solid-js'

const [user, setUser] = createSignal(null)

// In reactive computations
const greeting = createMemo(when(user, u => `Welcome, ${u.name}!`))

// With accessors
const userName = createMemo(
  when(
    () => user()?.profile,
    profile => profile.displayName,
  ),
)

// With fallback
const status = createMemo(
  when(
    user,
    u => u.status,
    () => 'offline',
  ),
)
```

### `every`

Returns a function that checks if all provided values are truthy and returns them as a tuple. Designed to be composed with `when`.

````tsx
import { when, every } from 'solid-whenever'
import { createSignal, createMemo } from 'solid-js'

const [user] = createSignal(null)
const [settings] = createSignal(null)
const [permissions] = createSignal(null)

// Compose with when
const displayName = createMemo(
  when(every(user, settings), ([user, settings]) =>
    settings.useNickname ? user.nickname : user.name
  )
)

// Multiple conditions
createEffect(
  when(every(user, settings, permissions), ([user, settings, permissions]) => {
    console.log(`${user.name} has ${permissions.role} role with ${settings.theme} theme`)
  })
)

### Solid wrappers

#### `whenEffect`

Creates an effect that runs when the value is truthy. Useful for side effects.

```tsx
import { whenEffect } from 'solid-whenever'

const [user, setUser] = createSignal(null)

// Runs effect only when user exists
whenEffect(user, u => {
  console.log(`User ${u.name} logged in`)
  // Setup user-specific listeners, etc.
})
````

#### `whenRenderEffect`

Like `whenEffect` but uses `createRenderEffect` internally. Useful for DOM manipulations.

```tsx
import { whenRenderEffect } from 'solid-whenever'

whenRenderEffect(videoElement, element => {
  element.play()
})
```

#### `whenComputed`

Creates a computed that runs when the value is truthy. Useful for dependent computations.

```tsx
import { whenComputed } from 'solid-whenever'

const [count, setCount] = createSignal(0)

// Only computes when count > 0
whenComputed(
  () => count() > 0,
  value => {
    console.log(`Positive count: ${value}`)
  },
)
```

#### `whenMemo`

Creates a memoized value that updates only when the condition is truthy.

```tsx
import { whenMemo } from 'solid-whenever'

const [user] = createSignal(null)

// Memoizes expensive computation only when user exists
const userStats = whenMemo(user, user => {
  return expensiveStatsCalculation(user)
})
```
