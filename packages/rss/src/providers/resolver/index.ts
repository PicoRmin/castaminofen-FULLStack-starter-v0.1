import { ProviderResolutionError } from '../errors';
import type {
  ProviderCapabilityName,
  ProviderContract,
  ProviderResolutionRequest,
  ProviderResolutionResult,
  ProviderResolutionStrategy,
} from '../types';
import { ProviderRegistry } from '../registry';

export class ProviderResolver {
  public constructor(
    private readonly registry: ProviderRegistry,
    private readonly strategies: readonly ProviderResolutionStrategy[] = [],
  ) {}

  public async resolve(request: ProviderResolutionRequest): Promise<ProviderResolutionResult> {
    const normalized = this.normalizeRequest(request);
    const candidates = this.collectCandidates(normalized);

    if (candidates.length === 0) {
      throw new ProviderResolutionError(
        'No providers matched the requested feed.',
        {
          request: normalized,
        },
        'Register at least one provider or broaden the matching criteria.',
      );
    }

    const evaluated = candidates
      .map((provider) => this.evaluateProvider(provider, normalized))
      .sort((left, right) => right.score - left.score);

    const winner = evaluated[0];
    if (!winner?.provider) {
      throw new ProviderResolutionError('Unable to resolve a provider.', {
        request: normalized,
      });
    }

    return {
      provider: winner.provider,
      score: winner.score,
      matchedHostname: winner.matchedHostname,
      matchedDomain: winner.matchedDomain,
      strategyNames: winner.strategyNames,
      reasons: winner.reasons,
    };
  }

  private normalizeRequest(request: ProviderResolutionRequest): ProviderResolutionRequest {
    const url = request.url.trim();
    const hostname = request.hostname ?? this.extractHostname(url);
    const domain = request.domain ?? hostname;
    return { ...request, url, hostname: hostname ?? undefined, domain: domain ?? undefined };
  }

  private collectCandidates(request: ProviderResolutionRequest): ProviderContract[] {
    const byCapability = request.capabilities?.length
      ? request.capabilities.flatMap((capability) => this.registry.getByCapability(capability))
      : this.registry.getAll();

    const seen = new Set<string>();
    const candidates = byCapability.filter((provider) => {
      const identifier = provider.metadata.id;
      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });

    return candidates.filter((provider) => provider.supports(request.url));
  }

  private evaluateProvider(provider: ProviderContract, request: ProviderResolutionRequest) {
    let score = provider.priority();
    const strategyNames: string[] = [];
    const reasons: string[] = [];
    let matchedHostname: string | undefined;
    let matchedDomain: string | undefined;

    const hostname = request.hostname ?? this.extractHostname(request.url);
    const domain = request.domain ?? hostname;

    for (const strategy of this.strategies) {
      const result = strategy.evaluate(provider, request);
      strategyNames.push(strategy.name);
      if (result.matched) {
        score += result.score;
        reasons.push(result.reason);
      }
    }

    if (
      hostname &&
      provider.metadata.domains.some((candidate) => this.matchesDomain(candidate, hostname))
    ) {
      score += 20;
      matchedHostname = hostname;
      reasons.push(`matched hostname ${hostname}`);
    }

    if (
      domain &&
      provider.metadata.domains.some((candidate) => this.matchesDomain(candidate, domain))
    ) {
      score += 20;
      matchedDomain = domain;
      reasons.push(`matched domain ${domain}`);
    }

    if (request.capabilities?.length) {
      const matchedCapabilities = provider
        .capabilities()
        .filter(
          (capability) =>
            capability.enabled &&
            request.capabilities?.includes(capability.name as ProviderCapabilityName),
        );
      if (matchedCapabilities.length > 0) {
        score += matchedCapabilities.length * 5;
        reasons.push(`matched ${matchedCapabilities.length} requested capabilities`);
      }
    }

    return { provider, score, matchedHostname, matchedDomain, strategyNames, reasons };
  }

  private extractHostname(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return undefined;
    }
  }

  private matchesDomain(pattern: string, value: string): boolean {
    const normalizedPattern = pattern.trim().toLowerCase();
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedPattern.startsWith('*.')) {
      const suffix = normalizedPattern.slice(2);
      return normalizedValue.endsWith(`.${suffix}`) || normalizedValue === suffix;
    }

    return normalizedValue === normalizedPattern;
  }
}

export class DefaultProviderResolutionStrategy implements ProviderResolutionStrategy {
  public readonly name = 'default';

  public evaluate(provider: ProviderContract, request: ProviderResolutionRequest) {
    const hostname = request.hostname ?? new URL(request.url).hostname;
    const hasDeclaredSupport = provider.metadata.formats.some(
      (format) => format === request.format,
    );
    return {
      matched: hasDeclaredSupport || provider.supports(request.url),
      score: hasDeclaredSupport ? 10 : 0,
      reason: hasDeclaredSupport ? 'declared format support' : 'supports() matched the URL',
    };
  }
}
