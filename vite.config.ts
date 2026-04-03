import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base =
  process.env.VITE_BASE_PATH ||
  (process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : '/')

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
