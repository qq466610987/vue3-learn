import { describe, expect, it, test } from 'vitest'
import { effect, track, trigger, reactive } from '../reactive/5.3'

describe('测试5.3节 如何代理 object', () => {
  it('可以代理for in 操作', () => {
    const obj = { foo: '1', bar: '2' }
    const p = reactive(obj)
    let n = 0
    effect(() => {
      for (const key in p) {
        console.log(key)
        n++
      }
    })
    expect(n).toBe(2)
    // todo: 有点疑惑，
    p.s = 2
    expect(n).toBe(5)
    p.s =3
    expect(n).toBe(8)
  })
})

