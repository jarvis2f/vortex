import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

const customJestConfig = {
  preset: "ts-jest",
  clearMocks: true,
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  collectCoverageFrom: ["<rootDir>/src/server/core/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testRegex: ".*\\.spec\\.ts$",
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
};

export default createJestConfig(customJestConfig);
