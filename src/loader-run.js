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
    loaderContext.loaderIndex = loaderContext.loaders.length - 1
    let resource = loaderContext.resource
    loaderContext.readResource(resource, (err, resourceBuffer) => {
        if (err) return finalCallbacks(err)
        processOptions.resourceBuffer = resourceBuffer
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
    if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
        return processResource(processOptions, loaderContext, finalCallbacks)
    }
    const currentLoader = loaderContext.loaders[loaderContext.loaderIndex]
    if (currentLoader.pitchExecuted) {
        loaderContext.loaderIndex++
        return iteratePitchingLoaders(
            processOptions,
            loaderContext,
            finalCallbacks
        )
    }
    let pitchFunction = currentLoader.pitch
    currentLoader.pitchExecuted = true
    if (!pitchFunction) {
        return iteratePitchingLoaders(
            processOptions,
            loaderContext,
            finalCallbacks
        )
    }

    runSyncOrAsync(
        pitchFunction,
        loaderContext,
        [
            loaderContext.remainRequest,
            loaderContext.previousRequest,
            (loaderContext.data = {})
        ],
        function (err, ...args) {
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
    if (currentLoader.pitchExecuted) {
        loaderContext.loaderIndex--
        return iterateNormalLoaders(
            processOptions,
            loaderContext,
            finalCallbacks
        )
    }
    let normalFunction = currentLoader.normal
    currentLoader.normalExecuted = true
    conventArgs(args, currentLoader.raw)
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
    let isSync = true //默认是同步
    let isDone = false //是否已经执行
    const innerCallback = (loaderContext.callback = function (err, ...args) {
        isDone = true
        isSync = false
        callback(null, ...args)
    })
    loaderContext.async = function () {
        isSync = false
        return innerCallback
    }
    let result = pitchFunction.apply(loaderContext, args)
    if (isSync) {
        isDone = false
        return callback(null, result)
    }
}

function runLoaders(options, callback) {
    let resource = options.resource //获取要加载的资源 src/index.jss
    let loaders = options.loaders || [] // 要结果哪些loader处理
    let loaderContext = options.context || {} //loader执行上下文
    let readResource = options.readResource || fs.readFile //读取文件内容的方法
    //把每一个loader从每一个loader绝对路径 转成一个loader对像
    loaders = loaders.map(createLoaderObject)
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
