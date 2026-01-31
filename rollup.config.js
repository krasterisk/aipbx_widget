import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const production = process.env.NODE_ENV === 'production';

export default {
    input: 'src/main.js',
    output: {
        file: production ? 'dist/widget.min.js' : 'dist/widget.js',
        format: 'iife',
        name: 'AIWidget',
        sourcemap: !production
    },
    plugins: [
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
                drop_console: false, // Разрешаем логи для отладки
                drop_debugger: true
            }
        })
    ].filter(Boolean)
};
