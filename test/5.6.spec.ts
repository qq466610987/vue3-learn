import { describe, expect, it, test } from 'vitest'
import { effect, track, trigger, reactive, shallowReactive, readonly } from '../reactive/5.6'
describe('只读', () => {
  it('只读', () => {
    const obj = {
      foo: 1
    }
    const p = readonly(obj)
    expect(p.foo).toBe(1)
    p.foo = 2
    expect(p.foo).toBe(1)
  })
})
