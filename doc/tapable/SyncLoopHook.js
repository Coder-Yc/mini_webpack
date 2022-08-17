/**
 * SyncLoopHook
 * 只要返回值不为undefined就会继续执行
 * 注意的是每次都要从头开始循环
 */

const { SyncLoopHook } = require('tapable')

const syncLoopHook = new SyncLoopHook(['name', 'age'])
let conunt1 = 0
let conunt2 = 0
let conunt3 = 0

syncLoopHook.tap('1', (name, age) => {
    console.log('count1', name, age)
    if (++conunt1 == 1) {
        conunt1 = 0 
        return undefined
    }
    return true
})
syncLoopHook.tap('2', (name, age) => {
    console.log('count2', name, age)
    if (++conunt2 == 2) {
        // conunt2 = 0
        return
    }
    return true
})

syncLoopHook.call('yc', 11)
