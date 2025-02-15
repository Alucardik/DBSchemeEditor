import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: ["build/", ".next/", "dist/"],
  },
  {
    rules: {
      "comma-dangle": ["error", "always-multiline"],
      quotes: ["error", "double"],
      semi: ["error", "never"],
      "object-curly-spacing": ["error", "always"],
      "space-infix-ops": ["error", { "int32Hint": false }],
      "@typescript-eslint/prefer-namespace-keyword": "always",
    },
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]

export default eslintConfig
