import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8000/openapi.json',
  output: {
    path: 'src/client',
    format: 'prettier',
    lint: 'eslint',
  },
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      queryKeys: true,
      mutationOptions: true,
      infiniteQueryOptions: true,
    },
  ],
});