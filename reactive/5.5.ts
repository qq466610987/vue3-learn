//本节是关于浅响应与深响应
//之前实现的响应式是浅响应


import { ITERATE_KEY } from "@vue/reactivity"

// 存储副作用函数的桶
const bucket: WeakMap<Data, Map<string, Set<EffectFn>>> = new WeakMap()

// 原始数据
type Data = {
  [key: string | symbol]: string | number | Data
}

enum TriggerType {
  SET = 'SET',
  ADD = 'ADD',
  DELETE = 'DELETE'
}
// 新增：创建深响应
export function reactive(obj: Data) {
  return createReactive(obj)
}
// 新增：创建浅响应
export function shallowReactive(obj: Data) {
  return createReactive(obj, true)
}
function createReactive(obj: Data, isShallow = false) {
  return new Proxy(obj, {
    // 拦截读取操作
    get(target, key, receiver) {
      // 代理对象可以通过raw 属性访问原始对象
      if (key === 'raw') {
        return target
      }
      // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
      track(target, key as string)
      // 返回属性值
      const res = Reflect.get(target, key, receiver)
      // 新增：用于解决深响应问题，当值是一个对象时，用reactive包裹为响应式数据
      if (!isShallow && res !== null && typeof res === 'object') {
        return createReactive(res)
      }
      return res
    },
    // 拦截设置操作
    set(target, key, newVal, receiver) {
      // 如果属性不存在，则说明是在添加新的属性，否则是设置已存在的属性
      const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD
      // 设置属性值
      const oldValue = target[key]
      const res = Reflect.set(target, key, newVal, receiver)
      // 判断receiver是否为target的代理对象，屏蔽由原型引起的更新，避免必要的更新
      if (target === receiver.raw) {
        if (oldValue !== newVal && (oldValue === oldValue || newVal === newVal)) {
          // 把副作用函数从桶里取出并执行
          trigger(target, key as string, type)
        }
      }


      return res
    },
    // 用于拦截"in"操作符
    has(target, key) {
      track(target, key as string)
      return Reflect.has(target, key)
    },
    // 用于拦截 "for in "操作符
    ownKeys(target) {
      track(target, ITERATE_KEY as unknown as string)
      return Reflect.ownKeys(target)
    },
    // 拦截"delete"操作符
    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const res = Reflect.defineProperty(target, key)
      if (res && hadKey) {
        // 只有当被删除的属性是对象自己的属性的时，才出发更新
        trigger(target, key, TriggerType.DELETE)
      }
    }

  })
}

export function track(target: Data, key: string) {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)

  activeEffect.deps.push(deps)
}

export function trigger(target: Data, key: string, type: TriggerType) {
  // 从全局"桶"中取出与代理对象关联的副作用函数映射
  const depsMap = bucket.get(target)
  if (!depsMap) return
  // 取得与key相关联的副作用函数
  const effects = depsMap.get(key)

  const effectsToRun: Set<EffectFn> = new Set()
  // 将与 key 相关联的副作用函数添加到effectsToRun
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
  // 将与 iterateEffects 相关联的副作用函数添加到effectsToRun
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    const iterateEffects = depsMap.get(ITERATE_KEY as unknown as string)
    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  effectsToRun.forEach(effectFn => {
    // 如果存在调度器的话，交给调度器去执行副作用函数
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })

  // effects && effects.forEach(effectFn => effectFn())
}

// 用一个全局变量存储当前激活的 effect 函数
interface Fn {
  (): void
}
interface EffectFn {
  (): void;
  options: {
    scheduler?: (fn: Fn) => void,
    lazy?: boolean
  };
  deps: Set<EffectFn>[]
}
let activeEffect: EffectFn;
// effect 栈
const effectStack: EffectFn[] = []

//用来注册副作用函数的函数
export function effect(fn: () => void, options = {}) {
  const effectFn: EffectFn = () => {
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数复制给 activeEffect
    activeEffect = effectFn
    // 在调用副作用函数之前将当前副作用函数压栈
    effectStack.push(effectFn)
    const res = fn()
    // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并还原 activeEffect 为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  // 将options 挂载在
  effectFn.options = options
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  if (!effectFn.options.lazy) {
    effectFn()
  }
  return effectFn;
}

function cleanup(effectFn: EffectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

// 调度执行
const jobQueue: Set<Fn> = new Set()
const p = Promise.resolve()

let isFlushing = false
function flushJob() {
  if (isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => job())
  }).finally(() => {
    isFlushing = false
  })
}



