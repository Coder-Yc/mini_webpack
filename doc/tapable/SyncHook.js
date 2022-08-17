const { SyncHook } = require('tapable')
const syncHook = new SyncHook(['name', 'age'])

syncHook.tap('1', (name, age) => {
    console.log('1', name, age)
})
syncHook.tap('2', (name, age) => {
    console.log('2', name, age)
})

syncHook.call('yc', 22)
