import type { DiscoveryHealthAssessment, DiscoveryQualityAssessment, DiscoveryValidationResult, DiscoveryWarning } from '../types';

export class FeedHealthAssessor {
  public async assess(validation: DiscoveryValidationResult, quality: DiscoveryQualityAssessment, warnings: readonly DiscoveryWarning[]): Promise<DiscoveryHealthAssessment> {
    const reasons: string[] = [];
    if (!validation.valid) {
      reasons.push('Validation checks failed.');
    }
    if (quality.score < 40) {
      reasons.push('Quality score is low.');
    }
    if (warnings.some((warning) => warning.code === 'missing-language')) {
      reasons.push('Language metadata is missing.');
    }

    let status: DiscoveryHealthAssessment['status'] = 'healthy';
    if (reasons.length > 1) {
      status = 'warning';
    }
    if (!validation.valid) {
      status = 'broken';
    }
    if (quality.score < 20) {
      status = 'poor';
    }

    return {
      status,
      score: Math.max(0, Math.min(100, quality.score)),
      reasons,
    };
  }
}
