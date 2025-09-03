import { defineConfig } from 'orval';

export default defineConfig({
  nbfc: {
    input: {
      target: 'http://localhost:8000/openapi.json',
    },
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',
      baseUrl: 'http://localhost:8000',
      override: {
        mutator: {
          path: './src/api/mutator.ts',
          name: 'customInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});