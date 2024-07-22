import { describe, expect, it, test } from 'vitest'
import { effect, track, trigger, reactive,shallowReactive } from '../reactive/5.5'

describe('浅响应与深响应', () => {
  it('测试实现深响应', () => {
    const obj = {
      foo: {
        bar: 1
      }
    }
    const p = reactive(obj)
    let runTime = 0
    effect(() => {
      console.log(p.foo.bar)
      runTime++
    })
    expect(runTime).toBe(1)
    p.foo.bar = 2
    expect(runTime).toBe(2)
  })
  it('测试实现浅响应', () => {
    const obj = {
      foo: {
        bar: 1
      }
    }
    const p = shallowReactive(obj)
    let runTime = 0
    effect(() => {
      console.log(p.foo.bar)
      runTime++
    })
    expect(runTime).toBe(1)
    p.foo.bar = 2
    expect(runTime).toBe(1)
  })
})
