import { describe, vi, it, beforeAll, beforeEach, expect } from "vitest";
import { JSDOM } from 'jsdom'
import { createRenderer, domRenderOptions } from './12.6.ts'

describe('12.6 emit的实现', () => {
  let renderer;
  let dom;

  beforeAll(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
  });

  beforeEach(() => {
    renderer = createRenderer();
    document.body.innerHTML = '';
  });

  it('可以正确的触发emit事件', () => {
    const childrenComponent = {
      name: 'childrenComponent',
      setup(props, { emit }) {
        // 发射change事件
        emit('change', 1)
        return {
          emitClick: () => emit('change', 1)
        }
      },
      render() {
        return {
          type: 'div',
          children: '我是child组件',
          props: {
            onClick: () => this.emitClick()
          }
        }
      }
    }

    const mockFn = vi.fn()
    const parentComponent = {
      name: 'parentComponent',
      render() {
        return {
          type: childrenComponent,
          props: {
            onChange: () => mockFn()
          }
        }
      }
    }

    const parentVNode = {
      type: parentComponent
    }

    renderer.render(parentVNode, document.body)
    expect(document.body.innerHTML).toBe('<div>我是child组件</div>')
    expect(mockFn).toHaveBeenCalled()
    // 触发div的点击事件
    document.querySelector('div')?.click()
    // 验证点击事件是否被正确触发
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})