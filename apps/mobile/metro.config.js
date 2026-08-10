const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// monorepo: watch workspace packages for hot reload
config.watchFolders = [
  ...config.watchFolders,
  __dirname + '/../../packages/shared',
  __dirname + '/../../packages/ui',
];

// Point entry to expo.js in project root instead of node_modules/expo/AppEntry.js
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs'];
config.server.enhanceMiddleware = (middleware, server) => {
  return (req, res, next) => {
    // Rewrite default entry request to use project-local expo.js
    if (req.url.includes('/node_modules/expo/AppEntry')) {
      req.url = req.url.replace(
        '/node_modules/expo/AppEntry',
        '/expo.js'
      );
    }
    return middleware(req, res, next);
  };
};

module.exports = config;
