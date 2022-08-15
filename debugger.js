const webpack = require('./src/webpack.js')
//初始化参数,从配置文件中读取参数,然后和shell里的参数合并得到最终的配置文件
const options = require('./webpack.config.js')
//用参数去初始化一个compiler
const compiler = webpack(options)
//4. 调用run方法开始真正的编译
compiler.run((err, stats) => {
    console.log(stats)
})
