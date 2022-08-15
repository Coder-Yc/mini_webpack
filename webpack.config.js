const startPlugin = require('./plugins/run-plugin.js')
const donePlugin = require('./plugins/Done-plugin.js')
const loaderA = require('./loaders/loggera-loader')
const loaderB = require('./loaders/loggerb-loader')
const emitPlugin = require('./plugins/emit-plugins')
const path = require('path')
module.exports = {
    mode: 'development',
    devtool: false,
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js'
    },
    resolveLoader: {
        modules: ['loaders', 'node_modules']
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    // module: {
    //     rules: [
    //         {
    //             test: /\.js$/,
    //             use: [loaderA, loaderB]
    //         }
    //     ]
    // },
    plugins: [new startPlugin(), new donePlugin(), new emitPlugin()]
}
