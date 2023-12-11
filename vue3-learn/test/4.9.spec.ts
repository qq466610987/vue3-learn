import { describe, expect, it, test } from 'vitest'
import { watch, effect, obj } from '../reactive/4.9'

describe('reactive/watch', () => {
  it('should run', () => {
    let i = 0
    watch(obj, () => {
      i++
    })
    obj.bar++
    expect(i).toBe(1)
  })
})