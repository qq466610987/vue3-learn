import { describe, expect, it, test } from 'vitest'
import { effect, track, trigger, reactive } from '../reactive/5.4'

describe('合理触发响应', () => {
  it('当值没有发生变化时，不触发副作用函数', () => {
    const obj = { foo: 1 }
    const p = reactive(obj)
    let a = 1
    effect(() => {
      console.log(p.foo)
      a++
    })
    expect(a).toBe(2)
    p.foo = 1
    expect(a).toBe(2)
  })
  it('可以正确的处理从原型继承的值', () => {
    const obj = {}
    const proto = { bar: 1 }
    const child = reactive(obj)
    const parent = reactive(proto)
    Object.setPrototypeOf(child, parent)
    let effectFunRunTime = 0
    effect(() => {
      console.log(child.bar)
      effectFunRunTime++
    })
    expect(effectFunRunTime).toBe(1)
    // 
    child.bar = 2
    expect(effectFunRunTime).toBe(2)
  })
})
