import baseConfig from "../../eslint.base.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["**/database/gen/**"],
  },
  {
    rules: {
      "no-case-declarations": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lodash",
              message: "Import individual functions instead, like `import x from 'lodash/x'`",
            },
          ],
          patterns: [
            {
              group: ["*/logger.js", "**/logger.js"],
              message: "Direct import from logger.js is forbidden, use req.logger",
            },
          ],
        },
      ],
    },
  },
];
