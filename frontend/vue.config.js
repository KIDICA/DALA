const path = require("path");

module.exports = {
  outputDir: path.resolve(__dirname, "../public"),
  chainWebpack: config => {
    config.plugin('copy').tap(options => {
      const ignore = options[0][0].ignore;
      ignore.push('style/bootstrap/node_modules');
      ignore.push('style/bootstrap/site');
      ignore.push('style/bootstrap/.github');
      ignore.push('style/bootstrap/build');
      ignore.push('style/bootstrap/js');
      ignore.push('style/bootstrap/nuget');
      ignore.push('style/bootstrap/dist/js');
      ignore.push('/*');
    });

  },
  devServer: {
    proxy: "http://localhost:3000"
  }
};