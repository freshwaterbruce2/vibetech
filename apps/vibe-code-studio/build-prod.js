import { build } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function buildProject() {
  try {
    const result = await build({
      configFile: resolve(__dirname, 'vite.config.ts'),
      mode: 'production',
      build: {
        // Skip TypeScript type checking
        rollupOptions: {
          onwarn(warning, warn) {
            // Ignore certain warnings
            if (warning.code === 'UNRESOLVED_IMPORT') return
            if (warning.code === 'CIRCULAR_DEPENDENCY') return
            if (warning.code === 'THIS_IS_UNDEFINED') return
            warn(warning)
          }
        }
      }
    })
    
    console.log('Build completed successfully!')
    
    // Print bundle sizes
    if (result && result.output) {
      console.log('\nBundle sizes:')
      result.output.forEach(chunk => {
        if (chunk.type === 'chunk') {
          console.log(`${chunk.fileName}: ${(chunk.code.length / 1024).toFixed(2)} KB`)
        }
      })
    }
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildProject()