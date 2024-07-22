// 8.1 事件处理
import { effect, ref } from '@vue/reactivity'

interface VnodeElement extends HTMLElement {
  _vnode?: Object
}

function createRenderer(options) {
  const { createElement, insert, setElementText, patchProps } = options

  /**
   * 渲染虚拟节点的入口
   * @param vnode 虚拟节点
   * @param container 父容器
   */
  function render(vnode: Object, container: VnodeElement) {
    // 新的vnode存在,说明是更新或挂载操作
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      // 新的vnode不存在，且旧的vnode存在，说明是卸载操作
      if (container._vnode) {
        // 卸载操作
        unmount(container._vnode)
      }
    }


    // 把 vnode 存储到 container._vnode 下，即后续渲染中的旧 vnode
    container._vnode = vnode
  }

  function unmount(vnode) {
    const parent = (vnode._el as HTMLElement).parentNode
    parent?.removeChild(vnode._el)
  }
  /**
   * 执行更新或挂载
   * @param n1 旧的Vnode
   * @param n2 新的Vnode
   * @param container 
   */
  function patch(n1, n2, container: VnodeElement) {
    // 当新vnode的type和旧vnode不同时，执行卸载操作
    // 并将旧vnode设为null,后续执行挂载新节点的操作
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    // 代码运行到这里，证明是执行挂载操作或新旧节点的类型相同
    const { type } = n2
    if (typeof type === 'string') {
      // 挂载操作
      if (!n1) {
        mountElement(n2, container)
      } else {
        // 执行打补丁操作，之后补充
        patchElement(n1, n2)
      }
    } else if (typeof type === 'object') {
      //TODO: 进行组件处理
    } else {
      //TODO: 处理其他类型

    }


  }
  // 打补丁操作
  function patchElement(n1, n2) {

  }

  /**
   * 挂载元素
   * @param vnode 虚拟节点
   * @param container 虚拟节点container
   */
  function mountElement(vnode, container: VnodeElement) {
    const el = vnode._el = createElement(vnode.type) as HTMLElement

    // 处理children
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 当是数组时候，遍历调用patch函数
      vnode.children.forEach(element => {
        // 第一个参数传null是因为此时是挂载操作
        // 第三个参数传el,将children中的元素挂载在父节点el下
        patch(null, element, el)
      });
    }

    // 处理props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }

    insert(el, container)
  }

  return { render }
}

const renderer = createRenderer({
  createElement(tag) {
    console.log(`创建元素 ${tag}`)
    return document.createElement(tag)
  },
  setElementText(el, text) {
    console.log(`设置 ${JSON.stringify(el)} 的文本内容：${text}`)
    el.textContent = text
  },
  insert(el: HTMLElement, parent: HTMLElement, anchor = null) {
    console.log(`将 ${JSON.stringify(el)} 添加到 ${JSON.stringify(parent)} 下`)
    parent.insertBefore(el, anchor)
  },
  // 给el设置props
  patchProps(el: HTMLElement, key: string, preValue, nextValue) {
    function shouldSetAsProps(el: HTMLElement, key: string, value) {
      if (el.tagName === 'input' && key === 'form') return false;
      // 兜底
      return key in el;
    }
    // 新增： 以ON开头的视为事件
    if (/^on/.test(key)) {
      // 代理模式：通过invoker作为一个代理事件处理函数，不用再每次事件更新时，重新解绑再绑定，提高性能
      let invoker = el._vei
      const name = key.slice(2).toLocaleLowerCase()
      // 如果存在新的事件绑定函数，则为更新或新增
      if (nextValue) {
        if (!invoker) {
          // 代理的事件处理函数
          invoker = el._vei = (e) => {
            invoker.value(e)
          }
          el.addEventListener(name, invoker)
        }
        // 将真正的事件处理函数传递给invoker.value
        invoker.value = nextValue
      } else if (invoker) {
        // 如果新的事件绑定函数不存在，且存在旧的事件绑定函数，则解绑
        el._vei = null
        el.removeEventListener(name, invoker)
      }
    }


    // 对class做特殊处理
    if (key === 'class') {
      el.className = normalizeClass(nextValue)
    }
    // 如果domproperties里有属性key
    else if (shouldSetAsProps(el, key, nextValue)) {

      // 获取dom properties的类型
      const type = typeof el[key]
      // 处理边缘case,比如处理模板`<button disable>`
      if (type === 'boolean' && nextValue === '') {
        el[key] = true
      } else {
        el[key] = nextValue
      }
    } else {
      // DomProperties里没有属性key
      el.setAttribute(key, nextValue)
    }
  }
})

/**
 * class对象转换为html支持的class写法
 * @param classObj class
 * @returns 
 */
function normalizeClass(classObj: Array<Object> | string | Object): string {
  // classobj可能有三种方式
  // 1. 字符串方式 'foo bar'
  if (typeof classObj === 'string') {
    return classObj
  }
  // 2. 对象  {foo:true}
  if (Object.prototype.toString.call(classObj) === '[object Object]') {
    let result = ''
    for (const key in classObj) {
      if (classObj[key]) {
        result = result.concat(' ', key)
      }
    }
    return result
  }
  // 3. 两种形势结合['foo bar',{foo: true}]
  if (Array.isArray(classObj)) {
    let result = ''
    classObj.forEach(item => {
      result = result.concat(' ', normalizeClass(item))
    })
    return result.trim()
  }
  return ''
}

const vnode = {
  type: 'div',
  props: {
    class: [{ foo: true }, 'bar'],
    onClick: () => {
      alert('点击了')
    }
  },
  children: 'text'
}

renderer.render(vnode, document.getElementById('app') as HTMLElement)
