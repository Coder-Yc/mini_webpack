/**
 * 异步串行瀑布钩子
 * callback的第一个参数永远是error,后面才是值 
 */
const { AsyncSeriesWaterfallHook } = require('tapable')
const hook = new AsyncSeriesWaterfallHook(['name', 'age'])

hook.tapAsync('1', (name, age, callback) => {
    setTimeout(() => {
        console.log('1', name, age)
        callback(null, '1的回调钩子')
    }, 1000)
})
hook.tapAsync('2', (name, age, callback) => {
    setTimeout(() => {
        console.log('2', name, age)
        callback(null, '2的回调钩子')
    }, 3000)
})

hook.callAsync('yc', 22, () => {
    console.log('ok')
})
