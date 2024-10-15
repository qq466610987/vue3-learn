import { beforeAll, describe, it, expect, beforeEach, vi } from "vitest";
import { createRenderer, domRenderOptions } from './12.4'
import { JSDOM } from 'jsdom'

describe('12.4 ', () => {
  let renderer;
  let dom;

  beforeAll(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
  });

  beforeEach(() => {
    renderer = createRenderer(domRenderOptions);
    document.body.innerHTML = '';
  });

  // 定义公共的子组件
  const childCmp = {
    name: 'ChildComponent',
    props: {
      title: String
    },
    render() {
      return {
        type: 'div',
        children: `标题是: ${this.title}`
      }
    }
  }

  it('应正确处理props中的值', () => {
    const parentCmp = {
      name: 'ParentComponent',
      render() {
        return {
          type: childCmp,
          props: {
            title: 'hello'
          }
        }
      }
    }
    const compVNode = {
      type: parentCmp
    }
    renderer.render(compVNode, document.body)
    expect(document.body.innerHTML).toBe('<div>标题是: hello</div>')
  })

  it('当props的值变化时,可以正确的触发子组件的被动更新', async () => {
    const parentCmp = {
      name: 'ParentComponent',
      data() {
        return {
          title: '初始标题'
        }
      },
      render() {
        return {
          type: childCmp,
          props: {
            title: this.title
          }
        }
      }
    }

    const compVNode = {
      type: parentCmp
    }

    renderer.render(compVNode, document.body)
    expect(document.body.innerHTML).toBe('<div>标题是: 初始标题</div>')

    // 更新父组件的 title
    compVNode.component.state.title = '更新后的标题'
    // 等待微任务队列执行完毕
    await new Promise(resolve => setTimeout(resolve, 0))
    // 验证子组件是否正确更新
    expect(document.body.innerHTML).toBe('<div>标题是: 更新后的标题</div>')
  })
})

