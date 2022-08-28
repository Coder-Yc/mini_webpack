const fs = require('fs')

function createLoaderObject(request) {
    let loaderObj = {
        request,
        normal: null,
        pitch: null, //loader本身的pitch函数
        raw: false, //是否转成字符串 否则就是一个buffer
        data: {}, // 每一个 loader都有一个自定义数据对象,用来存放一些自定义信息,pitch和normal通信
        pitchExecuted: false, 
        normalExecuted: false
    }
    let normal = require(loaderObj.request) //加载模块
    loaderObj.normal = normal
    loaderObj.pitch = normal.pitch
    loaderObj.raw = normal.raw
    return loaderObj
}
/**
 * 读取文件
 * @param {*} processOptions
 * @param {*} loaderContext
 * @param {*} finalCallbacks
 */
function processResource(processOptions, loaderContext, finalCallbacks) {
    // set loader index to last loader
    loaderContext.loaderIndex = loaderContext.loaders.length - 1
    let resource = loaderContext.resource
    loaderContext.readResource(resource, (err, resourceBuffer) => {
        if (err) return finalCallbacks(err)
        processOptions.resourceBuffer = resourceBuffer
        //开始调用iterateNormalLoaders处理文件
        iterateNormalLoaders(
            processOptions,
            loaderContext,
            [resourceBuffer],
            finalCallbacks
        )
    })
}
/**
 * 执行pitch方法
 * @param {*} processOptions
 * @param {*} loaderContext
 * @param {*} finalCallbacks
 * @returns
 */
function iteratePitchingLoaders(processOptions, loaderContext, finalCallbacks) {
    // 如果所有 loaders 的 pitch 都执行完成
    // 开始读取资源文件
    if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
        return processResource(processOptions, loaderContext, finalCallbacks)
    }
    const currentLoader = loaderContext.loaders[loaderContext.loaderIndex]

    // 进入下一个 loader 的 pitch 函数
    if (currentLoader.pitchExecuted) {
        loaderContext.loaderIndex++
        return iteratePitchingLoaders(
            processOptions,
            loaderContext,
            finalCallbacks
        )
    }
    // 加载当前 loader 的 pitch 与 normal 函数
    let pitchFunction = currentLoader.pitch
    // 标识当前 loader 的 pitch 执行完成，就会走到上面的 loaderContext.loaderIndex++ 逻辑。
    currentLoader.pitchExecuted = true
    if (!pitchFunction) {
        return iteratePitchingLoaders(
            processOptions,
            loaderContext,
            finalCallbacks
        )
    }
    // 调用当前 loader 的 pitch，决定是否进入下个 pitch，
    // 还是跳过后面所有的 loader 的 pitch 与 normal(包括当前 normal)。
    runSyncOrAsync(
        pitchFunction,
        loaderContext,
        [
            loaderContext.remainRequest,
            loaderContext.previousRequest,
            (loaderContext.data = {})
        ],
        function (err, ...args) {
            // 如果当前 pitch 返回了一个不含有 `undefined` 的值
            // 那么就放弃之后的 loader 的 pitch 与 normal 的执行。
            var hasArg = args.some(function (value) {
                return value !== undefined
            })
            if (hasArg) {
                //看有没有返回值
                loaderContext.loaderIndex--
                iterateNormalLoaders(
                    processOptions,
                    loaderContext,
                    args,
                    finalCallbacks
                )
            } else {
                return iteratePitchingLoaders(
                    processOptions,
                    loaderContext,
                    finalCallbacks
                )
            }
        }
    )
}
/**
 *
 * @param {*} processOptions 选项对象
 * @param {*} loaderContext loader的上下文对象
 * @param {*} args 上一个loader传递的参数
 * @param {*} finalCallbacks 最终的回调函数
 * @returns
 */

/**
 * 如果 loaderContext.loaderIndex 已经小于 0，那么就执行 iteratePitchingLoaders 的回调函数，进而退出递归。
 * 如果当前 loader 的 normal 函数执行完了，也就是当前 loader.normalExecuted 的值为 true，就开始递减 loaderContext.loaderIndex，接着执行下一个 loader，
 * 否则就执行当前 loader 的 normal 函数，并且将 normalExecuted 属性设置为 true，这样下次递归 iterateNormalLoaders 的时候，就能进入下一个 loader 的执行了。
 * 执行当前 loader 会先调用 convertArgs 来决定是否将上一个 loader 传入的 result 转化为 buffer。
 */
function iterateNormalLoaders(
    processOptions,
    loaderContext,
    args,
    finalCallbacks
) {
    if (loaderContext.loaderIndex < 0) {
        return finalCallbacks(null, args)
    }
    const currentLoader = loaderContext.loaders[loaderContext.loaderIndex]
    if (currentLoader.normalExecuted) {
        loaderContext.loaderIndex--
        return iterateNormalLoaders(
            processOptions,
            loaderContext,
            args,
            finalCallbacks
        )
    }
    let normalFunction = currentLoader.normal
    currentLoader.normalExecuted = true
    conventArgs(args, currentLoader.raw)
    //判断为是需要buffer还是str之后调用runSyncOrAsync
    //它决定了当前 loader 的走向，支持异步 loader，同步 loader，也支持返回 promise 的 loader。
    runSyncOrAsync(normalFunction, loaderContext, args, (err, ...values) => {
        if (err) return finalCallbacks(err)
        iterateNormalLoaders(
            processOptions,
            loaderContext,
            args,
            finalCallbacks
        )
    })
}
/**
 *
 * @param {*} args
 * @param {*} raw 是否需要buffer
 */
function conventArgs(args, raw) {
    if (raw && !Buffer.isBuffer(args[0])) {
        args[0] = Buffer.from(args[0])
    } else if (!raw && Buffer.isBuffer(args[0])) {
        args[0] = args[0].toString('utf-8')
    }
}

function runSyncOrAsync(pitchFunction, loaderContext, args, callback) {
    let isSync = true //默认是同步,是来控制同步还是异步 loader的
    let isDone = false //是否已经执行,是防止 callback 被触发多次
    const innerCallback = (loaderContext.callback = function (err, ...args) {
        isDone = true
        isSync = false
        //这个 callback 会进入下一次的 iterateNormalLoaders 逻辑
        callback(null, ...args)
    })
    //我们在调用this.async的时候内部调用的就是这个innerCallback方法
    loaderContext.async = function () {
        isSync = false
        return innerCallback
    }
    //pitchFunction绑定了上下文 context，context 就是 runLoaders 内部声明的 loaderContext
    //它拥有很多属性和方法，这也就是为啥我们在 loader 里面能够通过 this 获取到它的属性和方法。
    let result = pitchFunction.apply(loaderContext, args)
    if (isSync) {
        isDone = false
        return callback(null, result)
    }
}

function runLoaders(options, callback) {
    let resource = options.resource //获取要加载的资源 src/index.js
    let loaders = options.loaders || [] // 要结果哪些loader处理
    let loaderContext = options.context || {} //loader执行上下文
    let readResource = options.readResource || fs.readFile //读取文件内容的方法
    //把每一个loader从每一个loader绝对路径 转成一个loader对像
    loaders = loaders.map(createLoaderObject)
    //loaderContext是所有loaders在处理资源时,共享的一种状态 
    //loaderIndex 是一个指针，它控制了所有 loaders 的 pitch 与 normal 函数的执行
    loaderContext.resource = resource
    loaderContext.readResource = readResource
    loaderContext.loaderIndex = 0 //当前正在执行的索引
    loaderContext.loaders = loaders //loader对像数组
    loaderContext.callback = null
    //调用async方法的时候, 可以吧这个loader从同步变成异步操作
    loaderContext.async = null

    Object.defineProperty(loaderContext, 'request', {
        get() {
            return loaderContext.loaders
                .map((l) => l.request)
                .concat(loaderContext.resource)
                .join('!')
        }
    })
    Object.defineProperty(loaderContext, 'remainRequest', {
        get() {
            return loaderContext.loaders
                .slice(loaderContext.loaderIndex + 1)
                .map((l) => l.request)
                .concat(loaderContext.resource)
                .join('!')
        }
    })
    Object.defineProperty(loaderContext, 'currentRequest', {
        get() {
            return loaderContext.loaders
                .slice(loaderContext.loaderIndex)
                .map((l) => l.request)
                .concat(loaderContext.resource)
                .join('!')
        }
    })
    Object.defineProperty(loaderContext, 'previousRequest', {
        get() {
            return loaderContext.loaders
                .slice(0, loaderContext.loaderIndex)
                .map((l) => l.request)
                .join('!')
        }
    })
    Object.defineProperty(loaderContext, 'data', {
        get() {
            return loaderContext.loaders[loaderContext.loaderIndex].data
        }
    })

    let processOptions = {
        resourceBuffer: null //要读取的资源,转换前的文件内容
    }
    iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
        callback(err, {
            result,
            resourceBuffer: processOptions.resourceBuffer
        })
    })
}
module.exports = runLoaders
