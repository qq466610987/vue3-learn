// 本部分实现调度执行的功能，
// 存储副作用函数的桶
const bucket: WeakMap<Data, Map<string, Set<EffectFn>>> = new WeakMap()

// 原始数据
type Data = {
  [key: string | symbol]: number
}
const data: Data = { foo: 1 }
// 对原始数据的代理
const obj = new Proxy(data, {
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
    scheduler?: (fn: Fn) => void
  };
  deps: Set<EffectFn>[]
}
let activeEffect: EffectFn;
// effect 栈
const effectStack: EffectFn[] = []

//用来注册副作用函数的函数
function effect(fn: () => void, options = {}) {
  const effectFn: EffectFn = () => {
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数复制给 activeEffect
    activeEffect = effectFn
    // 在调用副作用函数之前将当前副作用函数压栈
    effectStack.push(effectFn)
    fn()
    // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并还原 activeEffect 为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  // 将options 挂载在
  effectFn.options = options
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  effectFn()
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

effect(
  () => {
    console.log(obj.foo)
  },
  // options
  {
    // 调度器函数
    scheduler(fn: Fn) {
      jobQueue.add(fn)
      flushJob()
    }
  }
)

obj.foo++
obj.foo++

