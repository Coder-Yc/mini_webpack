// const loggerB = require('./loaders/loggerB')
// const loggerA = require('./loaders/loggerA')
const zipPlugin = require('./plugins/ZipPlugin.js')
const path = require('path')
module.exports = {
    mode: 'development',
    devtool: false,
    entry: './test/index.js',
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
    //             use: [loggerA, loggerB]
    //         }
    //     ]
    // },
    plugins: [
        new zipPlugin({
            filename: 'zipfile'
        })
    ]
}
