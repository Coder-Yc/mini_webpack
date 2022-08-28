const Complier = require('./complier.js')
const loaderRunner = require('loader-runner');
/**
 * Q: webpack的基本构件流程?
 * 1.首先webpack读取到传入的参数,然后和命令行的参数进行一个合并, 得到一个最终的参数
 * 2.通过那些参数去new一个compiler的实例, 然后去调用插件的apply方法来加载插件
 * 3.然后调用compiler的run方法开始真正的编译
 * 4.确定entry的入口,然后从入口文件出发,开始使用loader来翻译代码,用的是loaderRunner这个库,然后再找到文件依赖的模块,递归处理
 * 5.根据入口和模块之间的关系组成一个个chunk,把每一个chunk都转换成一个单独的文件加入到输出列表
 * 6.最后把文件写入到文件系统
 * 
 * 
 * Q: 执行loader的LoaderRunner运行机制
 * 1. 首先用每一个loader去创建一个对象,给每一个loader对象上都添加一些属性,包括normal函数和pitch函数
 * 2. 然后去初始化一个loaderContext,这是个共享的上下文,如当前执行到哪个loader了,同时给类似于当前正在执行和还没执行的loadeer增加一个get
 * 3. 然后调用iteratePitchingLoaders函数去d对loaders 的 pitch 与 normal 函数的执行。
 * 4. 等到pitch运行结束就去读取文件,然后调用normal函数,然后再去通过同步或者异步的调用他
 * 5. 之所以能同步或者异步处理 因为有这个runSyncOrAsync做了兼容处理
 * 
 * Q: 使用webpack开发时，你用过哪些插件
 * clean-webpack-plugin: 目录清理
 * html-webpack-plugin：简化 HTML 文件创建 (依赖于 html-loader)
 * mini-css-extract-plugin: 分离样式文件，CSS 提取为独立文件，支持按需加载 
 * webpack-merge：提取公共配置，减少重复配置代码
 * speed-measure-webpack-plugin：简称 SMP，分析出 Webpack 打包过程中 Loader 和 Plugin 的耗时，有助于找到构建过程中的性能瓶颈。
 * HotModuleReplacementPlugin：模块热替换
 * webpack-bundle-analyzer: 可视化 Webpack 输出文件的体积
 * 
 * Q: sourcemap的种类
 * inline-  将SourceMap内联到原始文件中，而不是创建一个单独的文件。
 * hidden-  hidden仍然会生成.map文件，但是打包后的代码中没有sourceMappingURL
 * eval-    会通过 eval 包裹每个模块打包后代码以及对应生成的SourceMap， 
 * cheap-   SourceMap 的代码定位只会定位到源码所在的行
 * 
 * production:none source-map hidden-source-map cheap-module-source-map
 * development: eval-source-map eval-cheap-source-map eval-cheap-module-source-map 
 * 
 * 
 * Q: Webpack的热更新原理
 * 客户端从服务端拉去更新后的文件，准确的说是 chunk diff (chunk 需要更新的部分)
 * 实际上 WDS 与浏览器之间维护了一个 Websocket，当本地资源发生变化时，WDS 会向浏览器推送更新，并带上构建时的 hash，让客户端与上一次资源进行对比。
 * 客户端对比出差异后会向 WDS 发起 Ajax 请求来获取更改内容(文件列表、hash)，
 * 这样客户端就可以再借助这些信息继续向 WDS 发起 jsonp 请求获取该chunk的增量更新。
 * 后面由 HotModulePlugin 来完成，提供了相关 API 以供开发者针对自身场景进行处理
 * 
 * 
 * Q: 配置文件上百行乃是常事，如何保证各个loader按照预想方式工作？
 * 可以使用 enforce 强制执行 loader 的作用顺序，
 * pre 代表在所有正常 loader 之前执行，post 是所有 loader 之后执行。(inline 官方不推荐使用)
 * 
 * @param {*} options 
 * @returns 
 */


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
