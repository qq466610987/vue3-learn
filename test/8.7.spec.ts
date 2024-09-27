import { beforeAll, describe, it, vi } from "vitest";
import { createRenderer } from '../render/8.7'

describe('8.7事件绑定', () => {
  let render;
  let viClickFn = vi.fn()
  beforeAll(() => {
    render = createRenderer({
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
          // 定义el._vei为一个对象，存储事件名称到事件处理函数的映射
          let invokers = el._vei || (el._vei = {})
          // 代理模式：通过invoker作为一个代理事件处理函数，不用再每次事件更新时，重新解绑再绑定，提高性能
          let invoker = invokers[key]
          const name = key.slice(2).toLocaleLowerCase()
          // 如果存在新的事件绑定函数，则为更新或新增
          if (nextValue) {
            if (!invoker) {
              // 将事件处理函数缓存到el._vei[key]下，避免覆盖
              invoker = el._vei[key] = (e) => {
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
  })

  it('可以正确的绑定事件', () => {
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
  })

  it('可以绑定多个事件', () => {

  })

  it('可以更新绑定事件', () => {

  })

})