class DonePlugin {
    apply(compiler) {
        // 挂载阶段
        compiler.hooks.done.tap('Running', () => {
            //执行阶段
            console.log('DonePlugin')
        })
    }
}
module.exports = DonePlugin
