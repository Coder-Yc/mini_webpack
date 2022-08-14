const startPlugin = require('./plugins/run-plugin.js')
const donePlugin = require('./plugins/Done-plugin.js')
const loaderA = require('./loaders/loggera-loader');
const loaderB = require('./loaders/loggerb-loader');
module.exports = {
    mode: 'development',
    entry: './index.js',
    resolveLoader: {
        modules: ["loaders", "node_modules"],
    },
    module: {
        rules:[
            {
                test: /\.js/,
                use:[
                    loaderA,
                    loaderB
                ]
            }
        ]
    },
    plugins: [new startPlugin(), new donePlugin()]
}
