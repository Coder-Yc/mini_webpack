/**
 * 异步串行钩子
 */
 const { AsyncSeriesHook } = require('tapable')
 const hook = new AsyncSeriesHook(['name', 'age'])
 
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
 