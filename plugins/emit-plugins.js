class startPlugin {
    apply(compiler) {
        // 注册run钩子
        compiler.hooks.emit.tap('emit', () => {
            compiler.assets['README.md'] = '我是readme'
        })
    }
}
module.exports = startPlugin
                        