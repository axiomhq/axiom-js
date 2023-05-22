// const { pathsToModuleNameMapper } = require('ts-jest/utils');

// import type { JestConfigWithTsJest } from 'ts-jest';
// import { defaults as tsjPreset } from 'ts-jest/presets';

// const jestConfig: JestConfigWithTsJest = {
//   extensionsToTreatAsEsm: ['.ts'],
//   moduleNameMapper: {
//     '^(\\.{1,2}/.*)\\.js$': '$1',
//   },
//   transform: {
//     '^.+\\.tsx?$': [
//       'ts-jest',
//       {
//         useESM: true,
//       },
//     ],
//     // ...tsjPreset.transform,
//   },
//   testEnvironment: 'node',
// };
// export default jestConfig;

const jestConfig = {
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
      '^.+\\.ts?$': 'ts-jest',
    },
    testEnvironment: 'node',
};
export default jestConfig;
