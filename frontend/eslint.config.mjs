import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
    ],
  },

  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript"
  ),

  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Next.js doesn't need React import
      "@next/next/no-img-element": "off", // Allow <img> if you want
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": "off", // Disable base rule
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
