/**
 * Public surface of the simulated-data module. Only the dashboard's composition root
 * (features/dashboard/dataSource.ts) and tests may import this; src/api must never do so.
 */
export { buildSampleDataset, SAMPLE_SEED, SAMPLE_WINDOW, type SampleDataset } from './dataset'
export {
  createSampleDashboardSource,
  parseSampleScenario,
  SAMPLE_SCENARIOS,
  type SampleScenario,
  type SampleSourceOptions,
} from './source'
