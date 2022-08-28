const JsZip = require('jszip')
const { RawSource } = require('webpack-sources')
class zipPlugin {
    constructor(options) {
        this.options = options
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('ZipPlugin', (compilation) => {
            compilation.hooks.processAssets.tapAsync(
                'ZipPlugin',
                (assets, callback) => {
                    let zip = new JsZip()
                    for (const asset in assets) {
                        let source = assets[asset].source()
                        zip.file(asset, source)
                    }
                    zip.generateAsync({ type: 'nodeBuffer' }).then(
                        (content) => {
                            assets[this.options.filename + '.zip'] =
                                new RawSource(content)
                            callback()
                        }
                    )
                }
            )
        })
    }
}
module.exports = zipPlugin
