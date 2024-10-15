import { describe, vi, it, beforeAll, beforeEach, expect } from "vitest";
import { JSDOM } from 'jsdom'
import { createRenderer } from './12.7.ts'

describe('12.7 slot插槽的实现', () => {
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

  it('可以正确的处理slot插槽', () => {
    const childrenComponent = {
      name: 'childrenComponent',
      render() {
        return {
          type: 'header',
          children: [this.$slots.header()]
        }
      }
    }

    const parentComponent = {
      name: 'parentComponent',
      render() {
        return {
          type: childrenComponent,
          children: {
            header() {
              return { type: 'h1', children: '我是标题' }
            },
          }
        }
      }
    }

    const parentVNode = {
      type: parentComponent
    }

    renderer.render(parentVNode, document.body)

    expect(document.body.innerHTML).toBe('<header><h1>我是标题</h1></header>')
  })
})