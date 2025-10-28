module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        (rule) => rule.enforce === 'pre' && rule.use && rule.use.some(
          (loader) => loader.loader && loader.loader.includes('source-map-loader')
        )
      );

      if (sourceMapLoaderRule) {
        sourceMapLoaderRule.exclude = [
          /node_modules\/@mediapipe/
        ];
      }

      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        {
          module: /node_modules\/@mediapipe/,
          message: /Failed to parse source map/
        }
      ];

      return webpackConfig;
    }
  }
};
