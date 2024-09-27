import { effect, ref } from '@vue/reactivity'

interface VnodeElement extends HTMLElement {
  _vnode?: Object
}

function createRenderer(options) {
  const { createElement, insert, setElementText } = options

  /**
   * 对外暴漏的渲染函数
   * @param vnode 
   * @param container 
   */
  function render(vnode: Object, container: VnodeElement) {
    // 新的vnode存在,说明是更新操作，将其与旧 vnode 一起传递给 patch 函数进行打补丁
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      // 新的vnode不存在，且旧的vnode存在，说明是卸载操作
      if (container._vnode) {
        // 暂时实现
        container.innerHTML = ''
      }
    }
    // 把 vnode 存储到 container._vnode 下，即后续渲染中的旧 vnode
    container._vnode = vnode
  }

  /**
   * 打补丁
   * 处理渲染逻辑函数，
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

  /**
   * 实际挂载节点的函数
   * @param n2 
   * @param container 
   */
  function mountElement(n2, container: VnodeElement) {
    const el = createElement(n2.type)

    if (typeof n2.children === 'string') {
      setElementText(n2, n2.children)
    } else if (Array.isArray(n2.children)) {
      // 当是数组时候，遍历调用patch函数
      n2.children.forEach(element => {
        // 第一个参数传null是因为此时是挂载操作
        // 第三个参数传el,将children中的元素挂载在父节点el下
        patch(null, element, el)
      });
    }
    // 处理vnode.props
    if (vnode.props) {
      for (const key in vnode.props) {
        el.setAttribute(key, vnode.props[key])
      }
    }

    insert(el, container)

  }
  return { render }
}

const vnode = {
  type: 'div',
  props: {
    id: 'foo'
  },
  children: [{
    type: 'p',
    children: 'hello'
  }]
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
