/**
 * 异步串行熔断钩子
 */
const { AsyncSeriesBailHook } = require('tapable')
const hook = new AsyncSeriesBailHook(['name', 'age'])

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
