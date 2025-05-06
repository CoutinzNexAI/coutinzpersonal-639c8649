import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next"; // Importa o plugin do Next.js

export default tseslint.config(
  // 1. Ignora pastas de build/geradas
  { ignores: ["dist/", ".next/"] }, // Adiciona .next/

  // 2. Configuração base para JS (recomendada pelo ESLint)
  js.configs.recommended,

  // 3. Configuração base para TS (recomendada pelo typescript-eslint)
  ...tseslint.configs.recommended,

  // 4. Configuração específica para ficheiros React/Next.js (TSX/TS)
  {
    files: ["**/*.{ts,tsx}"], // Aplica a ficheiros TS e TSX
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh, // Podes manter por agora
      "@next/next": nextPlugin,    // Regista o plugin Next.js
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }, // Habilita JSX
      },
      globals: {
        ...globals.browser, // Globais do Browser
        ...globals.node,    // Globais do Node.js (necessário para API routes, etc.)
      },
    },
    rules: {
      // --- Aplica regras recomendadas dos plugins ---
      ...reactHooks.configs.recommended.rules, // Regras para Hooks
      ...nextPlugin.configs.recommended.rules, // Regras recomendadas do Next.js
      ...nextPlugin.configs["core-web-vitals"].rules, // Regras Core Web Vitals

      // --- Ajustes específicos ---
      "react-refresh/only-export-components": [ // Regra do react-refresh (manter warn por agora)
        "warn",
        { allowConstantExport: true },
      ],

      // --- REATIVAR ESTA REGRA! ---
      // Avisa sobre variáveis não usadas, mas permite prefixar com _ para ignorar
      "@typescript-eslint/no-unused-vars": [
          "warn",
          { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],

      // Podes adicionar/sobrescrever outras regras aqui se necessário
    },
    settings: {
      react: {
        version: "detect", // Deteta automaticamente a versão do React
      },
    },
  },
);