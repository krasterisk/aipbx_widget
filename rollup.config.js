import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const production = process.env.NODE_ENV === 'production';

export default {
    input: 'src/main.js',
    output: {
        // Output widget.min.js for production, widget.dev.js for development
        file: production ? 'dist/widget.min.js' : 'dist/widget.dev.js',
        format: 'iife',
        name: 'AIWidget',
        sourcemap: !production
    },
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development')
        }),
        nodeResolve({
            browser: true
        }),
        commonjs(),
        postcss({
            extract: false,
            inject: true,
            minimize: production
        }),
        production && terser({
            compress: {
                // В продакшне удаляем только информационные логи, оставляем error/warn
                pure_funcs: ['console.log', 'console.debug', 'console.info'],
                drop_debugger: true
            },
            format: {
                comments: false
            }
        })
    ].filter(Boolean)
};
