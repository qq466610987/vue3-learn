import { describe, vi, it, beforeAll, beforeEach, expect } from "vitest";
import { JSDOM } from 'jsdom'
import { createRenderer } from './12.8.ts'
import { aW } from "vitest/dist/reporters-BECoY4-b.js";

describe('12.8 生命周期钩子函数的实现', () => {
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

  it('可以正确的处理生命周期钩子函数', async () => {
    const fn = vi.fn()
    const myComponent = {
      name: 'myComponent',
      setup() {
        renderer.onMounted(() => {
          fn()
        })
      },
      render() {
        return {
          type: 'div',
          children: 'hello world'
        }
      }
    }

    const vnode = {
      type: myComponent
    }

    renderer.render(vnode, document.body)

    expect(document.body.innerHTML).toBe('<div>hello world</div>')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(fn).toHaveBeenCalled()
  })
})