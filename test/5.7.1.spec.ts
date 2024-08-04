import { describe, expect, it, test } from 'vitest'
import { effect, track, trigger, reactive, shallowReactive, readonly } from '../reactive/5.7.1'
describe('数组的索引与length', () => {
  it('可以触发数组索引导致length变化的副作用函数', () => {
    const obj = reactive([0]) as Array<any>
    let effectTriggered = 0; // 用于记录effect是否被触发

    effect(() => {
      console.log(obj.length); // 当obj.length变化时，这里会打印新的length值
      effectTriggered++;  // 标记effect已被触发
    });

    // 触发数组索引变化，从而改变length
    obj.push(1); // 将数组长度从1变为2

    // 验证effect是否被触发
    expect(effectTriggered).toBe(2);
    expect(obj.length).toBe(2); // 验证数组长度是否正确变化

  })
})
