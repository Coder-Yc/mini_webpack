/**
 * 三个callback中只要有一个调用了就中止任务
 * 使用tapAsync注册的话,在callback中有传值就表示错误,中止程序
 * tapPromise注册的话,不管调用是resolve还是reject,只要往这两个里面穿值了,就相当于直接中止
 */

const { AsyncParallelBailHook } = require('tapable')
const hook = new AsyncParallelBailHook(['name', 'age'])

hook.tapAsync('1', (name, age, callback) => {
    setTimeout(() => {
        console.log('1', name, age)
        callback('1')
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
