import { build } from 'vite';

async function buildApp() {
  try {
    console.log('Starting build process...');
    await build({
      configFile: 'vite.config.js',
      mode: 'development'
    });
    console.log('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();