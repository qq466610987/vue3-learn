import { effect, ref } from '@vue/reactivity'

interface VnodeElement extends HTMLElement {
  _vnode?: Object
}

function createRenderer(options) {
  const { createElement, insert, setElementText } = options

  function render(vnode: Object, container: VnodeElement) {
    // 新的vnode存在,说明是更新操作
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      // 新的vnode不存在，且旧的vnode存在，说明是卸载操作
      if (container._vnode) {
        container.innerHTML = ''
      }
    }
    // 保存新的vnode

    container._vnode = vnode
  }

  /**
   * 
   * @param n1 旧的Vnode
   * @param n2 新的Vnode
   * @param container 
   */
  function patch(n1, n2, container: VnodeElement) {
    // 挂载操作
    if (!n1) {
      mountElement(n2, container)
    } else {
      // 执行打补丁操作，之后补充

    }

  }

  function mountElement(n2, container: VnodeElement) {
    const el = createElement(n2.type)

    if (typeof n2.children === 'string') {
      setElementText(n2, n2.children)
      // el.textContent = n2.children
    }
    insert(el, container)
    // container.appendChild(el)
  }
  return { render }
}

const vnode = {
  type: 'h1',
  children: 'hello'
}

const renderer = createRenderer({
  createElement(tag) {
    console.log(`创建元素 ${tag}`)
    return { tag }
  },
  setElementText(el, text) {
    console.log(`设置 ${JSON.stringify(el)} 的文本内容：${text}`)
    el.textContent = text
  },
  insert(el, parent, anchor = null) {
    console.log(`将 ${JSON.stringify(el)} 添加到 ${JSON.stringify(parent)} 下`)
    parent.children = el
  }
})
const container = { type: 'root ' }
renderer.render(vnode, container)
