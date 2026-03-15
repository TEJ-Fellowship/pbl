import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // server: {
  //   open: '/index.html', // opens automatically
  //   // You can’t directly force Chrome here, Vite just uses default browser
  // }
})
