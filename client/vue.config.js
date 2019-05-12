const path = require("path");

module.exports = {
  outputDir: path.resolve(__dirname, "../server/public"),
  chainWebpack: config => {
    //config.plugin('copy').tap(options => {
      //const ignore = options[0][0].ignore;
      //ignore.push('style/bootstrap/node_modules');
    //});
  },
  devServer: {
    proxy: "http://localhost:3000"
  }
};