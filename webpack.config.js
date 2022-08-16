const startPlugin = require('./plugins/run-plugin.js')
const donePlugin = require('./plugins/Done-plugin.js')
const loggerB = require('./loaders/loggerB')
const loggerA = require('./loaders/loggerA')
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
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [loggerA, loggerB]
            }
        ]
    }
    // plugins: [new startPlugin(), new donePlugin(), new emitPlugin()]
}
