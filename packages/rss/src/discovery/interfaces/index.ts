export interface IFeedDiscoveryService {
  discover(request: import('../types').DiscoveryRequest): Promise<import('../types').DiscoveryResult>;
}

export interface IFeedNormalizer {
  normalize(request: import('../types').DiscoveryRequest): Promise<import('../types').DiscoveryNormalizedFeed>;
}

export interface IFeedValidator {
  validate(request: import('../types').DiscoveryRequest, feed: import('../types').DiscoveryNormalizedFeed): Promise<import('../types').DiscoveryValidationResult>;
}

export interface IFeedIdentityResolver {
  resolve(request: import('../types').DiscoveryRequest, feed: import('../types').DiscoveryNormalizedFeed): Promise<import('../types').DiscoveryIdentity>;
}

export interface IFeedQualityAssessor {
  assess(request: import('../types').DiscoveryRequest, feed: import('../types').DiscoveryNormalizedFeed, validation: import('../types').DiscoveryValidationResult): Promise<import('../types').DiscoveryQualityAssessment>;
}

export interface IFeedHealthAssessor {
  assess(validation: import('../types').DiscoveryValidationResult, quality: import('../types').DiscoveryQualityAssessment, warnings: readonly import('../types').DiscoveryWarning[]): Promise<import('../types').DiscoveryHealthAssessment>;
}

export interface IFingerprintGenerator {
  generate(request: import('../types').DiscoveryRequest, feed: import('../types').DiscoveryNormalizedFeed, identity: import('../types').DiscoveryIdentity): Promise<import('../types').DiscoveryFingerprint>;
}
