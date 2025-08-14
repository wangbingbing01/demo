/**
 * 示例：测试只有副作用的 void 方法
 * 依赖接口（describe/it/expect 等）由框架注入或通过 hypium 导入
 * 若需要可改为：import { describe, it, expect, beforeEach } from '../hypiumApi'; (按项目真实导出调整)
 */

class VoidService {
  private items: string[] = []
  private processedTotal: number = 0

  addItem(name: string): void {
    // 副作用：内部列表被修改
    this.items.push(name)
  }

  remove(name: string): void {
    const idx = this.items.indexOf(name)
    if (idx < 0) {
      // 副作用：抛出异常（用于异常路径测试）
      throw new Error('ItemNotFound:' + name)
    }
    this.items.splice(idx, 1)
  }

  clear(): void {
    this.items = []
  }

  // 同步处理，回调被调用，内部被清空
  processAll(listener: (item: string) => void): void {
    for (const it of this.items) {
      listener(it)
      this.processedTotal++
    }
    this.items = []
  }

  // 异步处理（仍然 void），使用 setTimeout 模拟
  processAllAsync(listener: (item: string) => void): void {
    const snapshot = [...this.items]
    setTimeout(() => {
      for (const it of snapshot) {
        listener(it)
        this.processedTotal++
      }
      this.items = []
    }, 0)
  }

  get size(): number {
    return this.items.length
  }

  get totalProcessed(): number {
    return this.processedTotal
  }
}

describe('VoidService suite', () => {
  let service: VoidService

  beforeEach(() => {
    service = new VoidService()
    service.addItem('A')
    service.addItem('B')
    service.addItem('C')
  })

  it('addItem 与 size 副作用验证', () => {
    expect(service.size).assertEqual(3, '初始应为3')
    service.addItem('D')
    expect(service.size).assertEqual(4, '添加后应为4')
  })

  it('processAll 清空列表并调用回调 (同步 void)', () => {
    const received: string[] = []
    service.processAll(item => received.push(item))

    // 验证副作用：列表被清空
    expect(service.size).assertEqual(0, '处理后应清空')
    // 验证副作用：回调调用次数与参数
    expect(received.length).assertEqual(3)
    expect(received).assertDeepEquals(['A', 'B', 'C'])
    // 验证累计计数
    expect(service.totalProcessed).assertEqual(3)
  })

  it('processAll 再次调用对空列表无副作用', () => {
    service.processAll(() => {})
    expect(service.size).assertEqual(0)
    const before = service.totalProcessed
    service.processAll(() => {})
    expect(service.totalProcessed).assertEqual(before, '空列表再次处理不应增加')
  })

  it('remove 正常路径 (副作用：元素减少)', () => {
    service.remove('B')
    expect(service.size).assertEqual(2)
    // 再处理验证剩余元素
    const got: string[] = []
    service.processAll(i => got.push(i))
    expect(got).assertDeepEquals(['A', 'C'])
  })

  it('remove 异常路径 (断言抛错)', () => {
    const act = () => service.remove('Z')
    // 方式1：框架若提供 assertThrowError
    expect(act).assertThrowError(Error)
    // 方式2：也可捕获后 assert 匹配 message（根据你的断言扩展）
    try {
      act()
      expect(false).assertTrue('不应到达这里')
    } catch (e) {
      const msg = (e as Error).message
      expect(msg.indexOf('ItemNotFound') >= 0).assertTrue('应包含 ItemNotFound')
    }
  })

  it('processAllAsync 异步副作用验证 (包装为 Promise)', () => {
    const received: string[] = []
    // 返回 Promise 让测试框架等待（框架支持异步）
    return new Promise<void>((resolve, reject) => {
      service.processAllAsync(item => received.push(item))
      // 轮询/延迟等待副作用完成
      setTimeout(() => {
        try {
          expect(service.size).assertEqual(0)
          expect(received.length).assertEqual(3)
          expect(received).assertDeepEquals(['A', 'B', 'C'])
          expect(service.totalProcessed).assertEqual(3)
          resolve()
        } catch (err) {
          reject(err)
        }
      }, 10)
    })
  })

  it('clear 无返回值副作用', () => {
    service.clear()
    expect(service.size).assertEqual(0)
    service.processAll(() => {})
    expect(service.totalProcessed).assertEqual(0, 'clear 后未处理任何项')
  })
})
