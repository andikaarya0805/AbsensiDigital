const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = ({ config }) => {
  // Extract and parse the app.json config
  const customConfig = { ...config };

  // Create a config plugin to remove enableBundleCompression
  return withAppBuildGradle(customConfig, (config) => {
    if (config.modResults.language === 'groovy') {
      // Find and remove the line with enableBundleCompression
      config.modResults.contents = config.modResults.contents.replace(
        /enableBundleCompression\s*=[^\n]+\n?/g,
        ''
      );
    }
    return config;
  });
};
