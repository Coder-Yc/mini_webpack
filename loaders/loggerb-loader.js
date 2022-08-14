function loaderA(source) {
    return source + console.log('loaderA-----------//')
}
module.exports = loaderA
