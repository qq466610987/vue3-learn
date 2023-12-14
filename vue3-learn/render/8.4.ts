// 正确设置class属性
import { effect, ref } from '@vue/reactivity'

interface VnodeElement extends HTMLElement {
  _vnode?: Object
}

function createRenderer(options) {
  const { createElement, insert, setElementText, patchProps } = options

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

  /**
   * 挂载元素
   * @param vnode 虚拟节点
   * @param container 虚拟节点container
   */
  function mountElement(vnode, container: VnodeElement) {
    const el = createElement(vnode.type) as HTMLElement

    // 处理children
    if (typeof vnode.children === 'string') {
      setElementText(vnode, vnode.children)
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
  patchProps(el: HTMLElement, key, preValue, nextValue) {
    function shouldSetAsProps(el: HTMLElement, key: string, value) {
      if (el.tagName === 'input' && key === 'form') return false;
      // 兜底
      return key in el;
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
  type: 'p',
  props: {
    class: [{ foo: true }, 'bar']
  },
  children: 'text'
}

renderer.render(vnode, document.getElementById('app') as HTMLElement)
