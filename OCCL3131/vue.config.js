module.exports = {
  configureWebpack: {
    output: {
      filename: '[name].[hash].js'
    }
  },
  devServer: {
    https: true,
  },
  publicPath: ".",
  css: {
    loaderOptions: {
      sass: {
        data: `@import "@/styles/index.scss";`
      }
    }
  }
}