const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['./src/lambda.ts'],
    externals: [],
    output: {
      ...options.output,
      filename: 'lambda.js',
      libraryTarget: 'commonjs2',
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
          },
        }),
      ],
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          return lazyImports.includes(resource);
        },
      }),
    ],
  };
};

const lazyImports = [
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
];
