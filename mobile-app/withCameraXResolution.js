const { withProjectBuildGradle } = require('@expo/config-plugins');

const withCameraXResolution = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addResolutionStrategy(config.modResults.contents);
    }
    return config;
  });
};

function addResolutionStrategy(buildGradle) {
  const resolutionStrategyBlock = `
    subprojects {
        project.configurations.all {
            resolutionStrategy {
                force 'androidx.camera:camera-core:1.4.1'
                force 'androidx.camera:camera-camera2:1.4.1'
                force 'androidx.camera:camera-lifecycle:1.4.1'
                force 'androidx.camera:camera-video:1.4.1'
                force 'androidx.camera:camera-view:1.4.1'
                force 'androidx.camera:camera-extensions:1.4.1'
            }
        }
    }
`;

  if (buildGradle.includes('androidx.camera:camera-core:1.4.1')) {
    return buildGradle;
  }

  if (buildGradle.includes('allprojects {')) {
    return buildGradle.replace(
      /allprojects\s*\{/,
      `allprojects {${resolutionStrategyBlock}`
    );
  }

  return buildGradle + resolutionStrategyBlock;
}

module.exports = withCameraXResolution;
