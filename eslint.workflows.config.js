import yml from "eslint-plugin-yml";

const [pluginConfig, parserConfig, rulesConfig] = yml.configs["flat/recommended"];

export default [
  {
    ...pluginConfig,
    name: "github-workflows-plugin",
  },
  {
    ...parserConfig,
    name: "github-workflows-parser",
    files: [".github/workflows/**/*.{yml,yaml}"],
  },
  {
    ...rulesConfig,
    name: "github-workflows-rules",
    files: [".github/workflows/**/*.{yml,yaml}"],
    rules: {
      ...rulesConfig.rules,
      "yml/no-empty-document": "error",
      "yml/no-empty-mapping-value": "error",
    },
  },
];
