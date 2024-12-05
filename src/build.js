import { build } from 'vite';

async function buildApp() {
  try {
    console.log('Starting build process...');
    const result = await build({
      configFile: 'vite.config.js',
      mode: 'development'
    });
    console.log('Build completed successfully!');
    return result;
  } catch (error) {
    console.error('Build failed:', error);
    throw error;
  }
}

buildApp();