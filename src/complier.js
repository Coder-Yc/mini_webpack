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
        this.modules = new Set() // 所有的模块
        this.chunks = new Set() // 所有的代码块
        this.assets = {} //本次要产出的文价
        this.files = new Set() // 本次编译要产出的所有文件名
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
            //从入口文件出发,调用所有配置的Loader对模块进行编译
            let entryModule = this.buildModule(entry[entryName], entryPath)
            this.entry.add(entryModule)
            console.log(this.entry)
        }
    }
    /**
     * @param {*} entryName ./index.js
     * @param {*} entryPath /Users/yangchong/Desktop/Demo/webpack/mini_webpack/index.js
     */
    buildModule(entryName, entryPath) {
        //1.读取文件内容
        const originSourceCode = fs.readFileSync(entryPath, 'utf-8')
        let targetOriginCode = originSourceCode
        //2.获取需要处理的loader
        const rules = this.options.module.rules
        let loaders = []
        for (let rule in rules) {
            if (rules[rule].test.test(entryName)) {
                loaders = [...loaders, ...rules[rule].use]
            }
        }
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
        //7.找出入口依赖的模块,递归处理
        let moduleId = './' + path.relative(rootPath, entryPath)
        let module = { id: moduleId, dependencies: new Set(), name: entryName }
        //找出该模块依赖的模块

        let astTree = parser.parse(targetOriginCode, { sourceType: 'module' })
        debugger
        traverse(astTree, {
            CallExpression({ node }) {
                if (node.callee.name == 'require') {
                    const moduleNama = node.arguments[0].value // ./title
                    //获取要加载文件的目录
                    const dirPath = path.dirname(entryPath)
                    const depModulePath = path.join(dirPath, moduleNama) + '.js'
                    const depModuleId =
                        './' + path.relative(rootPath, depModulePath)
                    node.arguments = [types.stringLiteral(depModuleId)]
                    module.dependencies.add(depModulePath)
                }
            }
        })
        let { code } = generator(astTree)

        //此模块的源
        module._source = code
        module.dependencies.forEach((dependency) => {
            this.depModule = this.buildModule(entryName, dependency)
            this.modules.add(this.depModule)
        })
        return module
    }
}

module.exports = Complier
