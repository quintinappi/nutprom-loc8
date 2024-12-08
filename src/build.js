import { build } from 'vite';

async function buildApp() {
  try {
    console.log('Starting development build...');
    await build({
      mode: 'development',
      configFile: './vite.config.js'
    });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();