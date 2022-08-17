/**
 * SyncWaterfallHook
 * 上一个回调函数的值如果不为undefined,就把返回值作为参数给到下一个函数
 * 形成一个瀑布的形式,能连起来
 *
 */
const { SyncWaterfallHook } = require('tapable')
const syncWaterfallHook = new SyncWaterfallHook(['name', 'age'])

syncWaterfallHook.tap('1', (name, age) => {
    console.log('1', name, age)
    return '2'
})
syncWaterfallHook.tap('2', (name, age) => {
    console.log('2', name, age)
})

syncWaterfallHook.call('yc', 22)
