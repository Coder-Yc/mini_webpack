const { SyncHook } = require('tapable')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const types = require('@babel/types')
// import { cwd } from 'node:process'
const { cwd } = require('node:process')
const fs = require('fs')
const path = require('path')

// /Users/yangchong/Desktop/Demo/webpack/mini_webpack
let rootPath = cwd()
class Complier {
    constructor(options) {
        this.options = options
        this.hooks = {
            run: new SyncHook(), // 开启编译
            emit: new SyncHook(), // 写入文件系统
            done: new SyncHook() // 结束编译
        }
        this.entry = new Set() //所有文件的入口文件
        this.modules = new Set() // 所有的依赖模块
        this.chunks = new Set() // 所有的代码块
        this.assets = {} //本次要产出的文价
        this.files = new Set() //本次编译要产出的所有文件名
    }
    run(callFn) {
        //5. 根据entry找到入口
        let entry = {}
        const entries = this.options.entry

        if (typeof entries === 'string') {
            entry.main = entries
        } else {
            entry = entries
        }
        for (const entryName in entry) {
            let entryPath = path.join(rootPath, entry[entryName])
            // 6.从入口文件出发,调用所有配置的Loader对模块进行编译
            let entryModule = this.buildModule(entry[entryName], entryPath)
            this.entry.add(entryModule)
            // console.log(entry)
            // 8.根据入口和模块之间的依赖关系,组装成一个个包含多个模块的chunk

            let chunk = {
                name: entryName,
                id: entry[entryName],
                entryModule,
                modules: Array.from(this.modules).filter(
                    (module) => module.name === entry[entryName]
                )
            }
            this.chunks.add(chunk)
        }
        // 9.把每一个chunk转换成一个单独的文件加入到输出列表 this.assets对象key:文件名 value:文件的内容
        let output = this.options.output
        this.chunks.forEach((chunk) => {
            console.log(chunk.name)
            let filename = output.filename.replace('[name]', chunk.name)

            this.assets[filename] = getSource(chunk)
        })
        //在写入文件前最后触发事件
        this.hooks.emit.call()

        this.files = Object.keys(this.assets) //文件名数组
        //写入到dist中
        for (const file in this.assets) {
            let filePath = path.join(output.path, file)
            fs.writeFileSync(filePath, this.assets[file])
        }
        this.hooks.done.call()
        //回调函数
        callFn(null, {
            toJson: () => {
                return {
                    entries: this.entry,
                    chunks: this.chunks,
                    modules: this.modules,
                    files: this.files,
                    assets: this.assets
                }
            }
        })
    }
    /**
     * 编译模块loader
     * @param {*} entryName ./index.js
     * @param {*} entryPath /Users/yangchong/Desktop/Demo/webpack/mini_webpack/index.js
     */

    buildModule(entryName, entryPath) {
        //1.读取文件内容
        const originSourceCode = fs.readFileSync(entryPath, 'utf-8')
        let targetOriginCode = originSourceCode
        //2.获取需要处理的loader
        const rules = this.options.module?.rules
        let loaders = []
        if (!rules) {
            for (let rule in rules) {
                if (rules[rule].test.test(entryName)) {
                    loaders = [...loaders, ...rules[rule].use]
                }
            }
            //3. 执行loader
            if (loaders.length !== 0) {
                for (const loader of loaders) {
                    if (typeof loader === 'string') {
                        targetOriginCode = require(loaders[loader])(
                            targetOriginCode
                        )
                    } else {
                        targetOriginCode = loader(targetOriginCode)
                    }
                }
            }
        }
        //7.找出入口依赖的模块,递归处理
        let moduleId = './' + path.relative(rootPath, entryPath)
        let module = { id: moduleId, dependencies: new Set(), name: entryName }
        //找出该模块依赖的模块

        let astTree = parser.parse(targetOriginCode, { sourceType: 'module' })
        let extensions = this.options.resolve.extensions
        let modules = this.modules

        traverse(astTree, {
            CallExpression({ node }) {
                if (node.callee.name == 'require') {
                    const moduleNama = node.arguments[0].value // ./title
                    //获取要加载文件的目录
                    const dirPath = path.dirname(entryPath)
                    let depModulePath = path.join(dirPath, moduleNama)
                    depModulePath = tryExtension(depModulePath, extensions)
                    const depModuleId =
                        './' + path.relative(rootPath, depModulePath)
                    node.arguments = [types.stringLiteral(depModuleId)]

                    let alreadyModuleIds = Array.from(modules).map(
                        (module) => module.id
                    )
                    //不包含才去添加
                    if (!alreadyModuleIds.includes(depModuleId)) {
                        module.dependencies.add(depModulePath)
                    }
                }
            }
        })
        let { code } = generator(astTree)

        //此模块的源
        module._source = code
        module.dependencies.forEach((dependency) => {
            //递归编译模块
            this.depModule = this.buildModule(entryName, dependency)
            this.modules.add(this.depModule)
        })
        return module
    }
}
function getSource(chunk) {
    return `
     (() => {
        var __webpack_modules__ = {
            ${chunk.modules
                .map(
                    (module) => `{
                "${chunk.id}": ((module) => {
                    ${module._source}
                })
            }`
                )
                .join(',')}
        }
        var __webpack_module_cache__ = {}
        function __webpack_require__(moduleId) {
            var cachedModule = __webpack_module_cache__[moduleId]
            if (cachedModule !== undefined) {
                return cachedModule.exports
            }
            var module = (__webpack_module_cache__[moduleId] = {
                exports: {}
            })
            __webpack_modules__[moduleId](
                module,
                module.exports,
                __webpack_require__
            )
            return module.exports
        }
        var __webpack_exports__ = {}
        ;(() => {
        ${chunk.entryModule._source}
    })()
    })()`
}
function tryExtension(modulePath, extensions) {
    extensions.unshift('')
    let path
    extensions.forEach((extension, index) => {
        if (fs.existsSync(modulePath + extension)) {
            return (path = modulePath + extension)
        }
    })
    return path
}
module.exports = Complier
