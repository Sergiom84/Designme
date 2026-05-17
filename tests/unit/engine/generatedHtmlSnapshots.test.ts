import { describe, expect, it } from 'vitest';
import { buildGeneratedArtifact, generatedArtifactCases } from '../helpers/generatedArtifacts';

describe('generated HTML snapshots', () => {
  it.each(generatedArtifactCases)('matches the canonical HTML snapshot for $name', (testCase) => {
    const output = buildGeneratedArtifact(testCase);

    expect(output.html).toMatchSnapshot();
  });
});
