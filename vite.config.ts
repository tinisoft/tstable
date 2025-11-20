import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig(({ mode, command }) => {
  const isLibBuild = mode === 'lib' || command === 'build'
  
  if (isLibBuild) {
    return {
      plugins: [
        vue(),
        dts({
          insertTypesEntry: true,
          copyDtsFiles: true,
          include: ['src/**/*'],
          exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'examples/**/*']
        })
      ],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'TSDataGrid',
          fileName: (format) => `tsdatagrid.${format}.js`
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue'
            },
            exports: 'named'
          }
        },
        emptyOutDir: true
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src')
        }
      },
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern-compiler',
            silenceDeprecations: ['legacy-js-api', 'import']
          }
        }
      }
    }
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'tsdatagrid': resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api', 'import']
        }
      }
    }
  }
})