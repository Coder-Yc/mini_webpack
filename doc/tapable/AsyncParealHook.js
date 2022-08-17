/**
 * 异步并行钩子,相当于promise.all
 * 有个callback函数要到最后执行后才调用
 */

const { AsyncParallelHook } = require('tapable')
const hook = new AsyncParallelHook(['name', 'age'])

hook.tapAsync('1', (name, age, callback) => {
    setTimeout(() => {
        console.log('1', name, age)
        callback()
    }, 1000)
})
hook.tapAsync('2', (name, age, callback) => {
    setTimeout(() => {
        console.log('2', name, age)
        callback()
    }, 3000)
})

hook.callAsync('yc', 22, () => {
    console.log('ok')
})
