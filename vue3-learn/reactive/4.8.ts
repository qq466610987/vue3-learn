// 本部分实现computed
// 计算属性实现,包括懒执行，effect嵌套问题解决

// 存储副作用函数的桶
const bucket: WeakMap<Data, Map<string, Set<EffectFn>>> = new WeakMap()

// 原始数据
type Data = {
  [key: string | symbol]: number
}
const data: Data = { foo: 1, bar: 1 }
// 对原始数据的代理
export const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
    track(target, key)
    // 返回属性值
    return target[key]
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

function track(target: Data, key: string) {
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

function trigger(target: Data, key: string) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)

  const effectsToRun: Set<EffectFn> = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
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
  // 新增
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

// =========================
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

// 计算属性实现,包括懒执行，effect嵌套问题解决
export function computed(getter: () => void) {

  // 缓存上一次计算的值
  let value: any;

  // dirty标志,用来标识是否需要重新计算值
  let dirty = true

  const effectFn = effect(getter, {
    lazy: true,
    // 这里shceduler充当了钩子函数的作用,同时充分利用了JS闭包特性
    scheduler() {
      // 闭包
      if (!dirty) {
        dirty = true
        // 这里做的是当计算属性中任意一个响应式数据变化时，就会触发computerd.value 绑定的副作用函数
        // 补充：这里为什么要手动触发？想想在响应式数据中是访问器属性setter中触发的,而计算属性没有setter的,所以需要手动触发
        trigger(res, 'value')
      }
    }
  })

  const res = {
    get value() {
      if (!dirty) {
        value = effectFn()
        dirty = false
      }
      // 这里其实相当于把计算属性也变成了一个响应式数据, 收集访问res.value的副作用函数
      track(res, 'value')
      return value
    }
  }

  return res
}


export { data }


