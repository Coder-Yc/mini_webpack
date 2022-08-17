/**
 * SyncBailHook
 * 如果上一个回调函数的的值不为undefined,就停止往下
 * 形成熔断
 */

const { SyncBailHook } = require('tapable')
const syncBailHook = new SyncBailHook(['name', 'age'])

syncBailHook.tap('1', (name, age) => {
    console.log('1', name, age)
    return '2'
})
syncBailHook.tap('2', (name, age) => {
    console.log('2', name, age)
})

syncBailHook.call('yc', 22)
