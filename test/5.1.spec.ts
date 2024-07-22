import { describe, expect, it, test } from 'vitest'
import { effect, track, trigger } from '../reactive/5.1'

describe('测试effect是否可以追踪访问器属性', () => {
  // it('should run', () => {
  //   const obj = {
  //     foo: 1,
  //     get bar() {
  //       return this.foo
  //     },
  //     set bar(value) {
  //       this.foo = value
  //     }
  //   }
  //   let effectNumber = 0
  //   const p = new Proxy(obj, {
  //     // 拦截读取操作
  //     get(target, key) {
  //       // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
  //       track(target, key)
  //       // 返回属性值
  //       return target[key]
  //     },
  //     // 拦截设置操作
  //     set(target, key, newVal) {
  //       // 设置属性值
  //       target[key] = newVal
  //       // 把副作用函数从桶里取出并执行
  //       trigger(target, key)
  //       return true
  //     }
  //   })
  //   effect(() => {
  //     effectNumber++
  //   })
  //   p.bar++
  //   expect(effectNumber).toBe(1)
  //   p.foo++
  //   expect(effectNumber).toBe(1)
  // })
  // it('should run', () => {
  //   const obj = {
  //     foo: 1,
  //     get bar() {
  //       return this.foo
  //     },
  //     set bar(value) {
  //       this.foo = value
  //     }
  //   }
  //   let effectNumber = 0
  //   const p = new Proxy(obj, {
  //     // 拦截读取操作
  //     get(target, key) {
  //       // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
  //       track(target, key)
  //       // 返回属性值
  //       return target[key]
  //     },
  //     // 拦截设置操作
  //     set(target, key, newVal) {
  //       // 设置属性值
  //       target[key] = newVal
  //       // 把副作用函数从桶里取出并执行
  //       trigger(target, key)
  //       return true
  //     }
  //   })
  //   effect(() => {
  //     console.log(p.bar)
  //     effectNumber++
  //   })
  //   p.bar++
  //   expect(effectNumber).toBe(2)
  //   p.foo++
  //   expect(effectNumber).toBe(2) // 此时p.foo变化不会引起副作用函数的执行
  // })
  it('should run', () => {
    const obj = {
      foo: 1,
      get bar() {
        return this.foo
      },
      set bar(value) {
        this.foo = value
      }
    }
    let effectNumber = 0
    const p = new Proxy(obj, {
      // 拦截读取操作
      get(target, key, receiver) {
        // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
        track(target, key)
        // 返回属性值
        return Reflect.get(target, key, receiver)
      },
      // 拦截设置操作
      set(target, key, newVal) {
        // 设置属性值
        target[key] = newVal
        // 把副作用函数从桶里取出并执行
        trigger(target, key)
        return true
      }
    })
    effect(() => {
      console.log(p.bar)
      effectNumber++
    })
    p.bar++
    expect(effectNumber).toBe(2)
    p.foo++
    expect(effectNumber).toBe(3)
  })

  it('可以追踪in操作符', () => {
    const obj = {
      foo: 1,
      get bar() {
        return this.foo
      },
      set bar(value) {
        this.foo = value
      }
    }
    let effectNumber = 0
    const p = new Proxy(obj, {
      // 拦截读取操作
      get(target, key, receiver) {
        // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
        track(target, key)
        // 返回属性值
        return Reflect.get(target, key, receiver)
      },
      // 拦截设置操作
      set(target, key, newVal) {
        // 设置属性值
        target[key] = newVal
        // 把副作用函数从桶里取出并执行
        trigger(target, key)
        return true
      },
      has(target, key) {
        track(target, key)
        return Reflect.has(target, key)
      }
    })
    effect(() => {
      console.log('bar' in p)
      effectNumber++
    })
    p.bar++
    expect(effectNumber).toBe(2)
    p.foo++
    expect(effectNumber).toBe(3)
  })
})

