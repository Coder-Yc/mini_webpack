class startPlugin {
    apply(compiler) {
        // 注册run钩子
        compiler.hooks.run.tap("Running", () => {
            console.log("开启编译");
        });
    }
}
module.exports = startPlugin;
  