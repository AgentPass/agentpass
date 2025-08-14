import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  displayName: "agentbridge-be",
  preset: "../../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/apps/agentbridge-be",
};

export default config;
