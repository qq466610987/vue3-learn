function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}

function createRenderer(options) {

  const {
    createElement,
    insert,
    setElementText,
    patchProps,
    createText,
    setText
  } = options

  function mountElement(vnode, container, anchor) {
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
  
  /**
   * 更新子节点
   * 简单diff算法实现
   * @param n1 
   * @param n2 
   * @param container 
   */
  function patchChildren(n1, n2, container) {
    if (typeof n2.children === 'string') {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c))
      }
      setElementText(container, n2.children)
    } else if (Array.isArray(n2.children)) {
      const oldChildren = n1.children
      const newChildren = n2.children

      let lastIndex = 0
      // 遍历新的 children
      for (let i = 0; i < newChildren.length; i++) {
        const newVNode = newChildren[i]
        let j = 0
        let find = false
        // 遍历旧的 children
        for (j; j < oldChildren.length; j++) {
          const oldVNode = oldChildren[j]
          // 如果找到了具有相同 key 值的两个节点，则调用 `patch` 函数更新之
          if (newVNode.key === oldVNode.key) {
            find = true
            patch(oldVNode, newVNode, container)
            if (j < lastIndex) {
              // 需要移动
              // 因为简单算法是按照顺序执行的，所以此时遍历的节点i之前的节点一定都是排好序的
              const prevVNode = newChildren[i - 1]
              if (prevVNode) {
                const anchor = prevVNode.el.nextSibling
                insert(newVNode.el, container, anchor)
              }
            } else {
              // 更新 lastIndex
              lastIndex = j
            }
            break // 这里需要 break
          }
        }
        // 如果在旧节点中没有找到，证明该节点是新节点，此时要进行挂载操作
        if (!find) {
          const prevVNode = newChildren[i - 1]
          let anchor = null
          // 找锚点
          if (prevVNode) {
            anchor = prevVNode.el.nextSibling
          } else {
            anchor = container.firstChild
          }
          patch(null, newVNode, container, anchor)
        }
      }

      // 遍历旧的节点
      for (let i = 0; i < oldChildren.length; i++) {
        const oldVNode = oldChildren[i]
        // 拿着旧 VNode 去新 children 中寻找相同的节点
        const has = newChildren.find(
          vnode => vnode.key === oldVNode.key
        )
        if (!has) {
          // 如果没有找到相同的节点，则移除
          unmount(oldVNode)
        }
      }
      
    } else {
      if (Array.isArray(n1.children)) {
        n1.children.forEach(c => unmount(c))
      } else if (typeof n1.children === 'string') {
        setElementText(container, '')
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

function patch(n1, n2, container, anchor) {
  if (n1 && n1.type !== n2.type) {
    unmount(n1)
    n1 = null
  }

  const { type } = n2

  if (typeof type === 'string') {
    if (!n1) {
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2)
    }
  } else if (type === Text) {
    if (!n1) {
      const el = n2.el = createText(n2.children)
      insert(el, container)
    } else {
      const el = n2.el = n1.el
      if (n2.children !== n1.children) {
        setText(el, n2.children)
      }
    }
  } else if (type === Fragment) {
    if (!n1) {
      n2.children.forEach(c => patch(null, c, container))
    } else {
      patchChildren(n1, n2, container)
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

const renderer = createRenderer({
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
})

const Fragment = Symbol()
const VNode1 = {
  type: 'div',
  children: [
    { type: 'p', children: '1', key: 1 },
    { type: 'p', children: '2', key: 2 },
    { type: 'p', children: 'hello', key: 3 }
  ]
}
renderer.render(VNode1, document.querySelector('#app'))

const VNode2 = {
  type: 'div',
  children: [
    { type: 'p', children: '1', key: 1 },
    { type: 'p', children: '2', key: 2 }
  ]
}

setTimeout(() => {
  console.log('update')
  renderer.render(VNode2, document.querySelector('#app'))
}, 400);