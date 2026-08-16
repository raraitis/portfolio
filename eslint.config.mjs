// Flat ESLint config — replaces `next lint`, which Next 16 removed.
// eslint-config-next stays on 15.x until this machine runs an LTS node
// (its 16.x chain requires node ^20.19 || ^22.13 || >=24).
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default config;
