import { describe, expect, it, test } from 'vitest'

import { computed, effect, obj } from '../reactive/4.8'

describe('reactive/computed', () => {
  it('should run', () => {
    const sumRes = computed(() => obj.foo + obj.bar)
    effect(() => {
      
      console.log(sumRes.value)
    })
    obj.foo++
    expect(sumRes.value).toBe(3)
  })
})