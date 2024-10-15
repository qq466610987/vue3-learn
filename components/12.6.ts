import { effect, reactive, shallowReactive, shallowReadonly } from "@vue/reactivity"

function shouldSetAsProps(el: HTMLElement, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}

interface ComponentOptions {
  render?: () => VNode,
  data: () => object,
  props: object,
  setup?: (props: object, setupContext: any) => object | Function | void,
  beforeCreate: () => void,
  created: () => void,
  beforeMountd: () => void,
  mounted: () => void,
  beforeUpdate: () => void,
  updated: () => void,
  beforeUnmount: () => void,
  unmounted: () => void
}

interface VNode {
  type: string | ComponentOptions
  props: Object
  component: any
  children: string | Array<VNode>
  el: VHtmlElement | Text
}

interface VHtmlElement extends HTMLElement {
  _vei: Object
}

interface RenderOptions {
  createElement(tag: string): HTMLElement
  insert(child: Node, parent: Node, anchor?: Node): void
  setElementText(el: Element, text: string): void
  patchProps(el: VHtmlElement, key: string, preValue: any, nextValue: any): void
  createText(text: string): Text
  setText(node: Text, text: string): void
}

/**
 * 获取最长递增子序列
 * @param arr 
 * @returns 
 */
function lis(arr: Array<any>) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

export function createRenderer(options: RenderOptions = domRenderOptions) {

  const {
    createElement,
    insert,
    setElementText,
    patchProps,
    createText,
    setText
  } = options

  /**
   * 挂载节点
   * @param vnode 
   * @param container 
   * @param anchor 
   */
  function mountElement(vnode: VNode, container: HTMLElement, anchor: HTMLElement) {
    const el = vnode.el = createElement(vnode.type)
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach(child => {
        patch(null, child, el)
      })
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }

    insert(el, container, anchor)
  }

  function patchChildren(n1, n2, container) {
    if (typeof n2.children === 'string') {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c))
      }
      setElementText(container, n2.children)
    } else if (Array.isArray(n2.children)) {
      patchKeyedChildren(n1, n2, container)
    } else {
      if (Array.isArray(n1.children)) {
        n1.children.forEach(c => unmount(c))
      } else if (typeof n1.children === 'string') {
        setElementText(container, '')
      }
    }
  }

  function patchKeyedChildren(n1, n2, container) {
    const newChildren = n2.children
    const oldChildren = n1.children
    // 更新相同的前缀节点
    // 索引 j 指向新旧两组子节点的开头
    let j = 0
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]
    // while 循环向后遍历，直到遇到拥有不同 key 值的节点为止
    while (oldVNode.key === newVNode.key) {
      // 调用 patch 函数更新
      patch(oldVNode, newVNode, container)
      j++
      oldVNode = oldChildren[j]
      newVNode = newChildren[j]
    }

    // 更新相同的后缀节点
    // 索引 oldEnd 指向旧的一组子节点的最后一个节点
    let oldEnd = oldChildren.length - 1
    // 索引 newEnd 指向新的一组子节点的最后一个节点
    let newEnd = newChildren.length - 1

    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]

    // while 循环向前遍历，直到遇到拥有不同 key 值的节点为止
    while (oldVNode.key === newVNode.key) {
      // 调用 patch 函数更新
      patch(oldVNode, newVNode, container)
      oldEnd--
      newEnd--
      oldVNode = oldChildren[oldEnd]
      newVNode = newChildren[newEnd]
    }

    // 满足条件，则说明从 j -> newEnd 之间的节点应作为新节点插入
    if (j > oldEnd && j <= newEnd) {
      // 锚点的索引
      const anchorIndex = newEnd + 1
      // 锚点元素
      const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
      // 采用 while 循环，调用 patch 函数逐个挂载新增的节点
      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor)
      }
    } else if (j > newEnd && j <= oldEnd) {
      // j -> oldEnd 之间的节点应该被卸载
      while (j <= oldEnd) {
        unmount(oldChildren[j++])
      }
    } else {
      // 构造 source 数组
      const count = newEnd - j + 1  // 新的一组子节点中剩余未处理节点的数量
      const source = new Array(count)
      source.fill(-1)

      const oldStart = j
      const newStart = j
      let moved = false
      let pos = 0
      const keyIndex = {}
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key] = i
      }
      let patched = 0
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldChildren[i]
        if (patched < count) {
          const k = keyIndex[oldVNode.key]
          if (typeof k !== 'undefined') {
            newVNode = newChildren[k]
            patch(oldVNode, newVNode, container)
            patched++
            source[k - newStart] = i
            // 判断是否需要移动
            if (k < pos) {
              moved = true
            } else {
              pos = k
            }
          } else {
            // 没找到
            unmount(oldVNode)
          }
        } else {
          unmount(oldVNode)
        }
      }

      if (moved) {
        const seq = lis(source)
        // s 指向最长递增子序列的最后一个值
        let s = seq.length - 1
        let i = count - 1
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            // 说明索引为 i 的节点是全新的节点，应该将其挂载
            // 该节点在新 children 中的真实位置索引
            const pos = i + newStart
            const newVNode = newChildren[pos]
            // 该节点下一个节点的位置索引
            const nextPos = pos + 1
            // 锚点
            const anchor = nextPos < newChildren.length
              ? newChildren[nextPos].el
              : null
            // 挂载
            patch(null, newVNode, container, anchor)
          } else if (i !== seq[j]) {
            // 说明该节点需要移动
            // 该节点在新的一组子节点中的真实位置索引
            const pos = i + newStart
            const newVNode = newChildren[pos]
            // 该节点下一个节点的位置索引
            const nextPos = pos + 1
            // 锚点
            const anchor = nextPos < newChildren.length
              ? newChildren[nextPos].el
              : null
            // 移动
            insert(newVNode.el, container, anchor)
          } else {
            // 当 i === seq[j] 时，说明该位置的节点不需要移动
            // 并让 s 指向下一个位置
            s--
          }
        }
      }
    }

  }

  function patchElement(n1, n2) {
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props

    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key])
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null)
      }
    }

    patchChildren(n1, n2, el)
  }

  function unmount(vnode) {
    if (vnode.type === Fragment) {
      vnode.children.forEach(c => unmount(c))
      return
    }
    const parent = vnode.el.parentNode
    if (parent) {
      parent.removeChild(vnode.el)
    }
  }

  /**
   * 挂载组件
   * @param n2 
   * @param container 
   * @param anchor 
   */
  function mountComponent(vnode: VNode, container: HTMLElement, anchor: HTMLElement) {
    const componentOptions = vnode.type
    // 获取组件渲染函数
    const { render, data, props: propsOptions, setup,
      beforeCreate, created, beforeMountd, mounted, beforeUpdate, updated
    } = componentOptions as ComponentOptions

    // 调用beforeCreate钩子 
    beforeCreate && beforeCreate()

    // 调用data函数获取响应式数据
    const state = reactive(data ? data() : {})

    const [props, attrs] = resolveProps(propsOptions, vnode.props)

    // 组件实例，用于存储组件的状态信息
    const instance = {
      // 组件状态数据
      state,
      //将解析出的props包装为shallowReactive并定义在组件实例上
      props: shallowReactive(props),
      // 是否挂载
      isMounted: false,
      // 组件虚拟dom
      subtree: null
    }
    // 12.6新增，emit的实现
    /**
     * emit函数
     * @param event 事件名称
     * @param payload 传递给事件处理函数的参数
     */
    function emit(event: string, ...payload: any) {
      // 根据约定对事件名称进行处理：例如change --> onChange
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
      // 根据处理后的事件名称去props中寻找对应的事件处理函数
      const handler = instance.props[eventName]
      if (handler) {
        handler(...payload)
      } else {
        console.error(`${eventName}事件不存在`)
      }
    }

    // 12.5 新增： setup函数的实现
    // setupState用来存储由setup函数返回的数据
    let setupState: object | null = null
    if (setup) {
      // 此处暂时只设置attrs,emit/slots等后续再添加
      const setupContext = { attrs, emit }
      const setupResult = setup(
        // 将props设置为readonly,避免setup函数中修改props
        shallowReadonly(instance.props),
        setupContext
      )
      if (typeof setupResult === 'function') {
        if (render) {
          console.error('setup函数也返回了渲染函数，render函数将被忽略')
        }
        render = setupResult
      } else {
        setupState = setupResult as object
      }

    }
    // 将组件实例设置到vnode中，便于后续更新
    vnode.component = instance

    // 创建渲染上下文对象，暴漏props和state状态数据给渲染函数，使得渲染函数可以通过this访问
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        const { state, props } = t
        if (state && k in state) {
          return state[k]
        } else if (k in props) {
          return props[k]
        } else if (setupState && k in setupState) {
          //12.5新增：渲染上下文增加对setupState的支持
          return setupState[k]
        } else {
          console.warn(`${String(k)}不存在`)
        }
      },
      set(t, k, v, r) {
        const { state, props } = t
        if (state && k in state) {
          state[k] = v
        } else if (k in props) {
          console.warn(`props是只读的`)
        } else if (k in setupState!) {
          setupState![k] = v
        } else {
          console.warn('不存在')
        }

      }
    })
    // 调用created钩子
    created && created.call(state)

    // 将渲染函数的执行包裹在effect函数中，从而实现自更新
    effect(() => {
      // 执行渲染函数，获取虚拟dom
      // 将render函数内的this指向state
      const subTree = render.call(renderContext, state)
      if (!instance.isMounted) {
        // 调用beforeMountd钩子
        beforeMountd && beforeMountd.call(renderContext)

        // 调用patch函数来挂载组件
        patch(null, subTree, container, anchor)
        instance.isMounted = true
        // 调用mounted钩子
        mounted && mounted.call(renderContext)
      } else {
        z
        // 调用beforeUpdate钩子
        beforeUpdate && beforeUpdate.call(renderContext)

        // 当组件已经挂载，说明此时是更新操作，拿旧的虚拟dom与新的虚拟dom进行打不定操作
        patch(instance.subtree, subTree, container, anchor)

        // 调用updated钩子
        updated && updated.call(renderContext)
      }
      // 更新实例中的虚拟子树
      instance.subtree = subTree
    }, {
      // 指定调度器为一个微任务队列，减少不必要的刷新
      // scheduler: queueJob
    })
  }

  /**
   * 解析props
   * @param options 为子组件传递的props选项
   * @param propsData 子组件中定义的props
   * @returns 
   */
  function resolveProps(options = {}, propsData = {}) {
    const props = {}
    const attrs = {}
    // 遍历为组件传递的props
    for (const key in propsData) {
      // 12.6新增：以字符串on开头的的props，无论是否显示声明，都将其添加到props对象中
      if (key in options || key.startsWith('on')) {
        // 如果为组件传递的props在组件自身的props中存在，则将其添加到props对象中
        props[key] = propsData[key]
      } else {
        // 否则将其添加到attrs对象中
        attrs[key] = propsData[key]
      }
    }
    return [props, attrs]
  }

  /**
   * 检测新旧props是否发生变化
   * @param preProps 
   * @param nextProps 
   * @returns 
   */
  function hasPropsChanged(preProps = {}, nextProps = {}): Boolean {
    const nextKeys = Object.keys(preProps)
    if (nextKeys.length !== Object.keys(nextProps).length) {
      return true
    }
    for (let i = 0; i < nextKeys.length; i++) {
      if (nextKeys[i] !== nextProps[i]) {
        return true
      }
    }
    return false
  }

  const p = Promise.resolve()
  const queue = new Set()
  let isFlushing = false
  function queueJob(job) {
    if (job) {
      queue.add(job)
    }
    if (!isFlushing) {
      isFlushing = true
      p.then(() => {
        try {
          queue.forEach(jon => job())
        } finally {
          isFlushing = false
        }
      })
    }
  }

  function patchComponent(n1: VNode, n2: VNode, anchor: HTMLElement) {
    // 获取组件实例，即n1.component，同时让新的组件虚拟节点 n2.component也指向组件实例
    const instance = (n2.component = n1.component)
    const { props } = instance
    // 监测props是否真的发生变化，如果是，则更新props
    if (hasPropsChanged(n1.props, n2.props)) {
      // 重新获取新节点props数据
      const [nextProps] = resolveProps(n2.type.props, n2.props)
      // 重新赋值props
      for (const k in nextProps) {
        props[k] = nextProps[k]
      }
      // 删除不存在的props
      for (const k in props) {
        if (!(k in nextProps)) delete props[k]
      }
    }
  }

  function patch(n1: VNode | null, n2: VNode, container: HTMLElement, anchor?: HTMLElement) {
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }

    const { type } = n2

    if (typeof type === 'string') {
      if (!n1) {
        mountElement(n2, container, anchor!)
      } else {
        patchElement(n1, n2)
      }
    } else if (type === Text) {
      if (!n1) {
        const el = n2.el = createText(n2.children as string)
        insert(el, container)
      } else {
        const el = n2.el = n1.el
        if (n2.children !== n1.children) {
          setText(el as Text, n2.children as string)
        }
      }
    } else if (type === Fragment) {
      if (!n1) {
        (n2.children as Array<VNode>).forEach(c => patch(null, c, container))
      } else {
        patchChildren(n1, n2, container)
      }
    } else if (typeof type === 'object') {
      // 新增: vnode.type的值是对象，作为组件处理
      if (!n1) {
        mountComponent(n2, container, anchor!)
      } else {
        patchComponent(n1, n2, anchor!)
      }
    }
  }


  function render(vnode, container) {
    if (vnode) {
      // 新 vnode 存在，将其与旧 vnode 一起传递给 patch 函数进行打补丁
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        // 旧 vnode 存在，且新 vnode 不存在，说明是卸载(unmount)操作
        unmount(container._vnode)
      }
    }
    // 把 vnode 存储到 container._vnode 下，即后续渲染中的旧 vnode
    container._vnode = vnode
  }

  return {
    render
  }
}

export const domRenderOptions: RenderOptions = {
  createElement(tag) {
    return document.createElement(tag)
  },
  setElementText(el, text) {
    el.textContent = text
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  },
  createText(text) {
    return document.createTextNode(text)
  },
  setText(el, text) {
    el.nodeValue = text
  },
  patchProps(el, key, prevValue, nextValue) {
    if (/^on/.test(key)) {
      const invokers = el._vei || (el._vei = {})
      let invoker = invokers[key]
      const name = key.slice(2).toLowerCase()
      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            console.log(e.timeStamp)
            console.log(invoker.attached)
            if (e.timeStamp < invoker.attached) return
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach(fn => fn(e))
            } else {
              invoker.value(e)
            }
          }
          invoker.value = nextValue
          invoker.attached = performance.now()
          el.addEventListener(name, invoker)
        } else {
          invoker.value = nextValue
        }
      } else if (invoker) {
        el.removeEventListener(name, invoker)
      }
    } else if (key === 'class') {
      el.className = nextValue || ''
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key]
      if (type === 'boolean' && nextValue === '') {
        el[key] = true
      } else {
        el[key] = nextValue
      }
    } else {
      el.setAttribute(key, nextValue)
    }
  }
}

const Fragment = Symbol()
const Text = Symbol()

export function init() {
  const renderer = createRenderer(domRenderOptions)
  // 在用户层面声明组件
  const MyComponent: ComponentOptions = {
    name: 'myComponent',
    data() {
      return {
        foo: 'hello world1'
      }
    },
    beforeCreate() {
      console.log('beforeCreate')
    },
    beforeMountd() {
      console.log('beforeMountd')
    },
    mounted() {
      console.log('mounted')

    },
    render() {
      return {
        type: 'div',
        children: `foo的值为: ${this.foo}`
      }
    }
  }

  // 虚拟dom
  const compVNode = {
    type: MyComponent
  }

  renderer.render(compVNode, document.body)
}

