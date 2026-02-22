import { defineConfig } from "eslint-define-config";
import next from "eslint-plugin-next";

export default defineConfig({
  plugins: {
    next,
  },
    rules: {
      "no-unused-vars": "warn",
      "react/react-in-jsx-scope": "off",
    },
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts"
    ],
  },
);