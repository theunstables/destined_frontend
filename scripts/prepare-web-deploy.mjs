import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')

await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))
await writeFile(resolve(dist, '.nojekyll'), '')

console.log('Prepared dist/404.html and dist/.nojekyll for static hosting.')
