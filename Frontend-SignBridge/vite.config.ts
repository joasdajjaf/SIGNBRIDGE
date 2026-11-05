/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Se mide toda la lógica de la interfaz.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',        // arranque: solo monta <App />, no tiene lógica de negocio
        'src/**/*.test.{ts,tsx}',
        'src/test/**',         // configuración de los tests
        'src/**/*.d.ts',       // solo tipos, no se ejecutan
      ],
      reporter: ['text', 'html'],
      // Umbral de la semana 4 = max(40, real de S3) redondeado hacia abajo.
      // Si la cobertura baja de aquí, "pnpm test" falla. Solo puede subir:
      // ver docs/matriz-rotacion.md
      thresholds: { lines: 40, statements: 39, functions: 35, branches: 34 },
    },
  },
})
