import { createRoot } from 'solid-js'
import { isServer } from 'solid-js/web'
import { describe, expect, it, vi } from 'vitest'
import { check, every, when, whenMemo, whenComputed, whenRenderEffect } from '../src'

describe('environment', () => {
  it('runs on server', () => {
    expect(typeof window).toBe('undefined')
    expect(isServer).toBe(true)
  })
})

/**********************************************************************************/
/*                                                                                */
/*                              Core Functionality                                */
/*                                                                                */
/**********************************************************************************/

describe('Core Functionality (SSR)', () => {
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

  describe('whenMemo', () => {
    it('returns memoized value only when condition is truthy (initial run only in SSR)', () =>
      createRoot(dispose => {
        let computeCount = 0
        let fallbackCount = 0

        const result = whenMemo(
          null,
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

        dispose()
      }))

    it('executes callback for truthy initial values in SSR', () =>
      createRoot(dispose => {
        let computeCount = 0

        const result = whenMemo(
          5,
          v => {
            computeCount++
            return v * 2
          },
          () => -1,
        )

        expect(result()).toBe(10)
        expect(computeCount).toBe(1)

        // Access again, should not recompute
        expect(result()).toBe(10)
        expect(computeCount).toBe(1)

        dispose()
      }))

    it('provides undefined as previous value on initial run in SSR', () =>
      createRoot(dispose => {
        const previousValues: any[] = []

        const result = whenMemo(1, (v, prev) => {
          previousValues.push(prev)
          return v * 2
        })

        expect(result()).toBe(2)
        expect(previousValues).toEqual([undefined])

        dispose()
      }))
  })

  describe('whenRenderEffect', () => {
    it('runs render effect when value is truthy (initial run only in SSR)', () =>
      createRoot(dispose => {
        let callbackResult: any = null
        let fallbackCount = 0

        whenRenderEffect(
          null,
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

        dispose()
      }))

    it('executes callback for truthy initial values in SSR', () =>
      createRoot(dispose => {
        let callbackResult: any = null

        whenRenderEffect(
          'test',
          v => {
            callbackResult = v
            return v
          },
        )

        expect(callbackResult).toBe('test')

        dispose()
      }))
  })

  describe('whenComputed', () => {
    it('runs computed when value is truthy (initial run only in SSR)', () =>
      createRoot(dispose => {
        const callback = vi.fn((v: number) => v * 2)
        const fallback = vi.fn()

        whenComputed(null, callback, fallback)

        expect(callback).not.toHaveBeenCalled()
        expect(fallback).toHaveBeenCalledTimes(1)

        dispose()
      }))

    it('executes callback for truthy initial values in SSR', () =>
      createRoot(dispose => {
        const callback = vi.fn((v: number) => v * 2)

        whenComputed(5, callback)

        expect(callback).toHaveBeenCalledWith(5, undefined)
        expect(callback).toHaveBeenCalledTimes(1)

        dispose()
      }))

    it('runs eagerly on creation in SSR', () =>
      createRoot(dispose => {
        let runCount = 0

        whenComputed(1, () => {
          runCount++
        })

        // Computed runs eagerly
        expect(runCount).toBe(1)

        dispose()
      }))
  })
})

/**********************************************************************************/
/*                                                                                */
/*                              Edge Cases & Special Values                       */
/*                                                                                */
/**********************************************************************************/

describe('Edge Cases & Special Values (SSR)', () => {
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

      truthyValues.forEach(value => {
        expect(check(value, () => 'truthy')).toBe('truthy')
        expect(when(value, () => 'truthy')()).toBe('truthy')
      })
    })
  })
})
