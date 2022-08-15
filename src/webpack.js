const Complier = require('./complier.js')
function webpack(options) {
    //1. 合并参数
    let shellOptions = process.argv.slice(2).reduce((config, args) => {
        let [key, value] = args.split('=') //--mode="development"
        config[key.slice(2)] = value
        return config
    }, {})
    let finalOptions = { ...options, ...shellOptions }
    //2. 初始化complier
    const complier = new Complier(finalOptions)
    //3. 加载所有的plugin(plugin是基于compiler)
    if (finalOptions.plugins && Array.isArray(finalOptions.plugins)) {
        for (const plugin of finalOptions.plugins) {
            plugin.apply(complier)
        }
    }
    return complier
}

module.exports = webpack
