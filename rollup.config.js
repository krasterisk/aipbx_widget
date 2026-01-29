import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

const production = process.env.NODE_ENV === 'production';

export default {
    input: 'src/main.js',
    output: {
        file: 'dist/widget.js',
        format: 'iife',
        name: 'AIWidget',
        sourcemap: !production
    },
    plugins: [
        postcss({
            extract: false,
            inject: true,
            minimize: production
        }),
        production && terser({
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        })
    ].filter(Boolean)
};
