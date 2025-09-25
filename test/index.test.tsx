import { createMemo, createRoot, createSignal } from 'solid-js'
import { isServer } from 'solid-js/web'
import { describe, expect, it, vi } from 'vitest'
import {
  check,
  every,
  when,
  whenComputed,
  whenEffect,
  whenify,
  whenMemo,
  whenRenderEffect,
} from '../src'

describe('environment', () => {
  it('runs on client', () => {
    expect(typeof window).toBe('object')
    expect(isServer).toBe(false)
  })
})

/**********************************************************************************/
/*                                                                                */
/*                              Core Functionality                                */
/*                                                                                */
/**********************************************************************************/

describe('Core Functionality', () => {
  describe('check', () => {
    it('returns undefined for all falsy values', () => {
      expect(check(null, v => v)).toBe(undefined)
      expect(check(undefined, v => v)).toBe(undefined)
      expect(check(false, v => v)).toBe(undefined)
      expect(check(0, v => v)).toBe(undefined)
      expect(check('', v => v)).toBe(undefined)
      expect(check(NaN, v => v)).toBe(undefined)
    })

    it('executes callback for truthy values', () => {
      expect(check(true, () => 'result')).toBe('result')
      expect(check(1, v => v * 2)).toBe(2)
      expect(check('hello', v => v.toUpperCase())).toBe('HELLO')
      expect(check({ name: 'test' }, v => v.name)).toBe('test')
      expect(check([], () => 'array')).toBe('array')
      expect(check({}, () => 'object')).toBe('object')
    })

    it('passes the truthy value to callback', () => {
      const callback = vi.fn((v: any) => v)

      check(42, callback)
      expect(callback).toHaveBeenCalledWith(42)

      check('test', callback)
      expect(callback).toHaveBeenCalledWith('test')

      const obj = { foo: 'bar' }
      check(obj, callback)
      expect(callback).toHaveBeenCalledWith(obj)
    })

    it('works with accessors', () =>
      createRoot(dispose => {
        const [value, setValue] = createSignal<string | null>(null)

        expect(check(value, v => v.toUpperCase())).toBe(undefined)

        setValue('hello')
        expect(check(value, v => v.toUpperCase())).toBe('HELLO')

        setValue(null)
        expect(check(value, v => v.toUpperCase())).toBe(undefined)

        dispose()
      }))

    it('executes fallback when value is falsy', () => {
      expect(
        check(
          null,
          v => v,
          () => 'fallback',
        ),
      ).toBe('fallback')
      expect(
        check(
          false,
          v => v,
          () => 'fallback',
        ),
      ).toBe('fallback')
      expect(
        check(
          0,
          v => v,
          () => 'fallback',
        ),
      ).toBe('fallback')
      expect(
        check(
          '',
          v => v,
          () => 'fallback',
        ),
      ).toBe('fallback')
      expect(
        check(
          undefined,
          v => v,
          () => 'fallback',
        ),
      ).toBe('fallback')
    })

    it('does not execute fallback when value is truthy', () => {
      const fallback = vi.fn(() => 'fallback')

      expect(check(true, () => 'result', fallback)).toBe('result')
      expect(fallback).not.toHaveBeenCalled()

      expect(check(1, v => v * 2, fallback)).toBe(2)
      expect(fallback).not.toHaveBeenCalled()
    })
  })

  describe('when', () => {
    it('returns a function that conditionally executes', () => {
      const whenTrue = when(true, () => 'result')
      expect(whenTrue()).toBe('result')

      const whenFalse = when(false, () => 'result')
      expect(whenFalse()).toBe(undefined)

      const whenZero = when(0, () => 'result')
      expect(whenZero()).toBe(undefined)

      const whenEmptyString = when('', () => 'result')
      expect(whenEmptyString()).toBe(undefined)
    })

    it('passes arguments through to callback', () => {
      const callback = vi.fn((value: any, a: number, b: string) => `${value}-${a}-${b}`)
      const whenTrue = when(true, callback)

      expect(whenTrue(1, 'test')).toBe('true-1-test')
      expect(callback).toHaveBeenCalledWith(true, 1, 'test')
    })

    it('passes arguments through to fallback', () => {
      const fallback = vi.fn((a: number, b: string) => `fallback-${a}-${b}`)
      const whenFalse = when(false, v => v, fallback)

      expect(whenFalse(1, 'test')).toBe('fallback-1-test')
      expect(fallback).toHaveBeenCalledWith(1, 'test')
    })

    it('works with signals in reactive context', () =>
      createRoot(dispose => {
        const [enabled, setEnabled] = createSignal(false)
        const result = createMemo(
          when(
            enabled,
            () => 'enabled',
            () => 'disabled',
          ),
        )

        expect(result()).toBe('disabled')

        setEnabled(true)
        expect(result()).toBe('enabled')

        setEnabled(false)
        expect(result()).toBe('disabled')

        dispose()
      }))

    it('supports different return types for callback and fallback', () => {
      const withDifferentTypes = when(
        false as boolean,
        () => 42,
        () => 'fallback',
      )
      expect(withDifferentTypes()).toBe('fallback')

      const withDifferentTypes2 = when(
        true as boolean,
        () => 42,
        () => 'fallback',
      )
      expect(withDifferentTypes2()).toBe(42)
    })
  })

  describe('every', () => {
    it('returns undefined if any value is falsy', () => {
      expect(every(true, false, true)()).toBe(undefined)
      expect(every(1, 2, 0)()).toBe(undefined)
      expect(every('a', null, 'c')()).toBe(undefined)
      expect(every('a', 'b', '')()).toBe(undefined)
      expect(every(true, undefined, true)()).toBe(undefined)
      expect(every(1, NaN, 3)()).toBe(undefined)
    })

    it('returns all values as array if all are truthy', () => {
      expect(every(true, 1, 'hello')()).toEqual([true, 1, 'hello'])
      expect(every({ a: 1 }, [1, 2], 'test')()).toEqual([{ a: 1 }, [1, 2], 'test'])
      expect(every([], {}, true)()).toEqual([[], {}, true])
    })

    it('preserves value types in returned array', () => {
      const sym = Symbol('test')
      const bigInt = BigInt(123)
      const obj = { value: 'test' }

      const result = every(sym, bigInt, obj)()
      expect(result?.[0]).toBe(sym)
      expect(result?.[1]).toBe(bigInt)
      expect(result?.[2]).toBe(obj)
    })

    it('works with signals', () =>
      createRoot(dispose => {
        const [a, setA] = createSignal<number | null>(null)
        const [b, setB] = createSignal<string | null>(null)
        const [c, setC] = createSignal<boolean>(true)

        const result = createMemo(when(every(a, b, c), ([a, b, c]) => `${a}-${b}-${c}`))

        expect(result()).toBe(undefined)

        setA(1)
        expect(result()).toBe(undefined)

        setB('test')
        expect(result()).toBe('1-test-true')

        setC(false)
        expect(result()).toBe(undefined)

        setC(true)
        expect(result()).toBe('1-test-true')

        setA(null)
        expect(result()).toBe(undefined)

        dispose()
      }))

    it('handles many accessors', () => {
      const accessors = Array(10).fill(true)
      const result = every(...accessors)
      expect(result()).toHaveLength(10)
      expect(result()?.every(v => v === true)).toBe(true)

      const withFalsy = [...Array(9).fill(true), false]
      const result2 = every(...withFalsy)
      expect(result2()).toBe(undefined)
    })
  })

  describe('whenify', () => {
    it('transforms a function to conditionally execute based on accessor', () => {
      const mockFn = vi.fn((fn: () => any) => fn())
      const conditionalFn = whenify(mockFn)

      const result1 = conditionalFn(true, () => 'success')
      expect(result1).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)

      const result2 = conditionalFn(false, () => 'success')
      expect(result2).toBe(undefined)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('passes through fallback to wrapped function', () => {
      const mockFn = vi.fn((fn: () => any) => fn())
      const conditionalFn = whenify(mockFn)

      const result = conditionalFn(
        false,
        () => 'success',
        () => 'fallback',
      )
      expect(result).toBe('fallback')
    })

    it('works with reactive primitives', () =>
      createRoot(dispose => {
        let computeCount = 0
        const computedFn = vi.fn((fn: () => any) => {
          computeCount++
          return createMemo(fn)
        })

        const conditionalComputed = whenify(computedFn)
        const [show, setShow] = createSignal(false)

        const result = conditionalComputed(show, v => (v ? 'shown' : 'hidden'))

        expect(computedFn).toHaveBeenCalledTimes(1)
        expect(result()).toBe(undefined)

        setShow(true)
        expect(result()).toBe('shown')

        dispose()
      }))

    it('preserves function signatures and behavior', () => {
      const effectFn = vi.fn((fn: () => void) => {
        fn()
        return 'effect-result'
      })

      const conditionalEffect = whenify(effectFn)
      const callback = vi.fn()

      const result = conditionalEffect(true, callback)

      expect(callback).toHaveBeenCalled()
      expect(result).toBe('effect-result')
    })
  })


  describe('error handling', () => {
    it('propagates errors from callbacks in check', () => {
      expect(() =>
        check(true, () => {
          throw new Error('Test error')
        }),
      ).toThrow('Test error')
    })

    it('propagates errors from callbacks in when', () => {
      const whenError = when(true, () => {
        throw new Error('Test error')
      })

      expect(() => whenError()).toThrow('Test error')
    })

    it('propagates errors from fallback callbacks', () => {
      expect(() =>
        check(
          false,
          () => 'success',
          () => {
            throw new Error('Fallback error')
          },
        ),
      ).toThrow('Fallback error')
    })

    it('does not execute callback when accessor throws', () => {
      const callback = vi.fn()
      const accessor = () => {
        throw new Error('Accessor error')
      }

      expect(() => check(accessor, callback)).toThrow('Accessor error')
      expect(callback).not.toHaveBeenCalled()
    })
  })
})

/**********************************************************************************/
/*                                                                                */
/*                               Solid.js Wrappers                                */
/*                                                                                */
/**********************************************************************************/

describe('Solid.js Wrappers', () => {
  describe('whenEffect', () => {
    it('only runs effect when value is truthy', async () =>
      createRoot(async dispose => {
        const [value, setValue] = createSignal<string | null>(null)
        const callback = vi.fn((v: string) => v)
        const fallback = vi.fn()

        whenEffect(value, callback, fallback)

        // Initially falsy, should run fallback
        await Promise.resolve()
        expect(callback).not.toHaveBeenCalled()
        expect(fallback).toHaveBeenCalledTimes(1)

        setValue('test')
        await Promise.resolve()
        expect(callback).toHaveBeenCalledWith('test', undefined)
        expect(callback).toHaveBeenCalledTimes(1)
        expect(fallback).toHaveBeenCalledTimes(1)

        setValue('test2')
        await Promise.resolve()
        expect(callback).toHaveBeenCalledWith('test2', 'test')
        expect(callback).toHaveBeenCalledTimes(2)

        setValue(null)
        await Promise.resolve()
        expect(callback).toHaveBeenCalledTimes(2)
        expect(fallback).toHaveBeenCalledTimes(2)

        dispose()
      }))

    it('handles effect return values correctly', async () =>
      createRoot(async dispose => {
        const [value, setValue] = createSignal<number | null>(1)
        const results: number[] = []

        whenEffect(value, (v, prev) => {
          results.push(v)
          return v * 2 // Return a value that will become prev in next call
        })

        await Promise.resolve()
        expect(results).toEqual([1])

        setValue(2)
        await Promise.resolve()
        expect(results).toEqual([1, 2])

        setValue(null)
        await Promise.resolve()
        // When value is null, effect doesn't run
        expect(results).toEqual([1, 2])

        setValue(3)
        await Promise.resolve()
        // Effect runs again, prev should be the last return value (2 * 2 = 4)
        expect(results).toEqual([1, 2, 3])

        dispose()
      }))
  })

  describe('whenRenderEffect', () => {
    it('only runs render effect when value is truthy', async () =>
      createRoot(async dispose => {
        const [value, setValue] = createSignal<string | null>(null)
        let callbackResult: any = null
        let fallbackCount = 0

        whenRenderEffect(
          value,
          v => {
            callbackResult = v
            return v
          },
          () => {
            fallbackCount++
            callbackResult = 'fallback'
          },
        )

        // Initial state - value is null, so fallback should run
        expect(callbackResult).toBe('fallback')
        expect(fallbackCount).toBe(1)

        await new Promise(resolve => setTimeout(resolve, 0))

        setValue('test')
        expect(callbackResult).toBe('test')
        expect(fallbackCount).toBe(1)

        await new Promise(resolve => setTimeout(resolve, 0))

        setValue('test2')
        expect(callbackResult).toBe('test2')
        expect(fallbackCount).toBe(1)

        await new Promise(resolve => setTimeout(resolve, 0))

        setValue(null)
        expect(callbackResult).toBe('fallback')
        expect(fallbackCount).toBe(2)

        dispose()
      }))

    it('runs before effects', () =>
      createRoot(dispose => {
        const order: string[] = []
        const [value] = createSignal<boolean>(true)

        whenEffect(value, () => {
          order.push('effect')
        })

        whenRenderEffect(value, () => {
          order.push('render-effect')
        })

        // Render effects should run before normal effects
        expect(order).toEqual(['render-effect'])

        dispose()
      }))
  })

  describe('whenComputed', () => {
    it('only runs computed when value is truthy', () =>
      createRoot(dispose => {
        const [value, setValue] = createSignal<number | null>(null)
        const callback = vi.fn((v: number) => v * 2)
        const fallback = vi.fn()

        whenComputed(value, callback, fallback)

        expect(callback).not.toHaveBeenCalled()
        expect(fallback).toHaveBeenCalledTimes(1)

        setValue(5)
        expect(callback).toHaveBeenCalledWith(5, undefined)
        expect(callback).toHaveBeenCalledTimes(1)

        setValue(10)
        expect(callback).toHaveBeenCalledWith(10, 10) // prev is 5 * 2 = 10
        expect(callback).toHaveBeenCalledTimes(2)

        setValue(null)
        expect(fallback).toHaveBeenCalledTimes(2)

        dispose()
      }))

    it('runs eagerly on creation and updates', () =>
      createRoot(dispose => {
        const [value, setValue] = createSignal<number>(1)
        let runCount = 0

        whenComputed(value, () => {
          runCount++
        })

        // Computed runs eagerly
        expect(runCount).toBe(1)

        setValue(2)
        expect(runCount).toBe(2)

        dispose()
      }))
  })

  describe('whenMemo', () => {
    it('returns memoized value only when condition is truthy', () =>
      createRoot(dispose => {
        const [value, setValue] = createSignal<number | null>(null)
        let computeCount = 0
        let fallbackCount = 0

        const result = whenMemo(
          value,
          v => {
            computeCount++
            return v * 2
          },
          () => {
            fallbackCount++
            return -1
          },
        )

        expect(result()).toBe(-1)
        expect(computeCount).toBe(0)
        expect(fallbackCount).toBe(1)

        setValue(5)
        expect(result()).toBe(10)
        expect(computeCount).toBe(1)
        expect(fallbackCount).toBe(1)

        // Access again, should not recompute
        expect(result()).toBe(10)
        expect(computeCount).toBe(1)

        setValue(7)
        expect(result()).toBe(14)
        expect(computeCount).toBe(2)

        setValue(null)
        expect(result()).toBe(-1)
        expect(computeCount).toBe(2)
        expect(fallbackCount).toBe(2)

        dispose()
      }))

    it('provides previous value to callback', () =>
      createRoot(dispose => {
        const [value, setValue] = createSignal<number | null>(1)
        const previousValues: any[] = []

        const result = whenMemo(value, (v, prev) => {
          previousValues.push(prev)
          return v * 2
        })

        expect(result()).toBe(2)
        expect(previousValues).toEqual([undefined])

        setValue(2)
        expect(result()).toBe(4)
        expect(previousValues).toEqual([undefined, 2])

        setValue(3)
        expect(result()).toBe(6)
        expect(previousValues).toEqual([undefined, 2, 4])

        dispose()
      }))
  })

  describe('integration patterns', () => {
    it('works with nested when conditions', () =>
      createRoot(dispose => {
        const [user, setUser] = createSignal<{ name: string; role?: string } | null>(null)
        const [feature, setFeature] = createSignal<{ enabled: boolean } | null>(null)

        const result = whenMemo(user, u =>
          check(
            () => u.role === 'admin',
            when(feature, f => (f.enabled ? 'Admin with feature' : 'Admin without feature')),
          ),
        )

        expect(result()).toBe(undefined)

        setUser({ name: 'John' })
        expect(result()).toBe(undefined)

        setUser({ name: 'John', role: 'admin' })
        expect(result()).toBe(undefined)

        setFeature({ enabled: true })
        expect(result()).toBe('Admin with feature')

        setFeature({ enabled: false })
        expect(result()).toBe('Admin without feature')

        dispose()
      }))

    it('composes multiple conditions with every', () =>
      createRoot(dispose => {
        const [auth, setAuth] = createSignal<{ token: string } | null>(null)
        const [user, setUser] = createSignal<{ id: number } | null>(null)
        const [permissions, setPermissions] = createSignal<string[]>([])

        const canEdit = whenMemo(
          every(auth, user, () => permissions().includes('edit')),
          ([auth, user, hasEdit]) => ({
            authorized: true,
            token: auth.token,
            userId: user.id,
            canEdit: hasEdit,
          }),
        )

        expect(canEdit()).toBe(undefined)

        setAuth({ token: 'abc123' })
        setUser({ id: 42 })
        expect(canEdit()).toBe(undefined)

        setPermissions(['read', 'edit'])
        expect(canEdit()).toEqual({
          authorized: true,
          token: 'abc123',
          userId: 42,
          canEdit: true,
        })

        dispose()
      }))
  })
})

/**********************************************************************************/
/*                                                                                */
/*                              Edge Cases & Special Values                       */
/*                                                                                */
/**********************************************************************************/

describe('Edge Cases & Special Values', () => {
  describe('JavaScript special values', () => {
    it('handles all JavaScript falsy values correctly', () => {
      const falsyValues = [false, 0, -0, 0n, '', null, undefined, NaN]

      falsyValues.forEach(value => {
        expect(check(value, () => 'truthy')).toBe(undefined)
        expect(when(value, () => 'truthy')()).toBe(undefined)
      })
    })

    it('handles all JavaScript truthy values correctly', () => {
      const truthyValues = [
        true,
        1,
        -1,
        'hello',
        ' ',
        '0',
        'false',
        [],
        {},
        new Date(),
        /regex/,
        new Map(),
        new Set(),
        Symbol('test'),
        BigInt(1),
        Infinity,
        -Infinity,
      ]
      // Note: functions cannot be included in truthyValues because they're treated as accessors

      truthyValues.forEach(value => {
        expect(check(value, () => 'truthy')).toBe('truthy')
        expect(when(value, () => 'truthy')()).toBe('truthy')
      })
    })
  })
})
