import test from 'node:test';
import assert from 'node:assert/strict';
import { PersistenceCoordinator } from '../coordinator/persistence-coordinator';
import type { ImportPlan } from '../../import/deduplication';
import type { RepositoryExecutionTarget } from '../coordinator/repository-coordinator';

test('PersistenceCoordinator executes an immutable import plan and returns a typed result', async () => {
  const plan: ImportPlan = {
    decisions: [
      {
        type: 'CreatePodcast',
        reason: 'Create podcast',
        confidence: 'High',
        validationResult: { valid: true, errors: [], warnings: [] },
        matchedEntities: [],
        conflicts: [],
        warnings: [],
      },
      {
        type: 'CreateEpisode',
        reason: 'Create episode',
        confidence: 'High',
        validationResult: { valid: true, errors: [], warnings: [] },
        matchedEntities: [],
        conflicts: [],
        warnings: [],
      },
    ],
    entitiesToCreate: ['podcast', 'episode'],
    entitiesToUpdate: [],
    entitiesToMerge: [],
    entitiesToSkip: [],
    rejectedEntities: [],
    warnings: [],
    conflicts: [],
    statistics: {
      createdPodcasts: 1,
      updatedPodcasts: 0,
      createdEpisodes: 1,
      updatedEpisodes: 0,
      skippedEpisodes: 0,
      duplicateCount: 0,
      warningCount: 0,
      errorCount: 0,
      durationMs: 0,
    },
  };

  const repositories: readonly RepositoryExecutionTarget[] = [
    {
      name: 'podcastRepository',
      entity: 'podcast',
      action: 'create',
      repository: {
        execute: async (operation) => ({ entity: operation.entity, action: operation.action, success: true }),
      },
    },
    {
      name: 'episodeRepository',
      entity: 'episode',
      action: 'create',
      repository: {
        execute: async (operation) => ({ entity: operation.entity, action: operation.action, success: true }),
      },
    },
  ];

  const coordinator = new PersistenceCoordinator({ repositories });
  const result = await coordinator.execute({ plan, correlationId: 'corr-1' });

  assert.equal(result.success, true);
  assert.deepEqual(result.committedEntities, ['podcast', 'episode']);
  assert.equal(typeof result.transaction?.id === 'string' && result.transaction.id.length > 0, true);
  assert.equal(result.statistics.totalOperations, 2);
});

test('PersistenceCoordinator rolls back the execution when a repository fails', async () => {
  const plan: ImportPlan = {
    decisions: [
      {
        type: 'CreatePodcast',
        reason: 'Create podcast',
        confidence: 'High',
        validationResult: { valid: true, errors: [], warnings: [] },
        matchedEntities: [],
        conflicts: [],
        warnings: [],
      },
    ],
    entitiesToCreate: ['podcast'],
    entitiesToUpdate: [],
    entitiesToMerge: [],
    entitiesToSkip: [],
    rejectedEntities: [],
    warnings: [],
    conflicts: [],
    statistics: {
      createdPodcasts: 1,
      updatedPodcasts: 0,
      createdEpisodes: 0,
      updatedEpisodes: 0,
      skippedEpisodes: 0,
      duplicateCount: 0,
      warningCount: 0,
      errorCount: 0,
      durationMs: 0,
    },
  };

  const repositories: readonly RepositoryExecutionTarget[] = [
    {
      name: 'podcastRepository',
      entity: 'podcast',
      action: 'create',
      repository: {
        execute: async () => {
          throw new Error('boom');
        },
      },
    },
  ];

  const coordinator = new PersistenceCoordinator({ repositories });
  const result = await coordinator.execute({ plan });

  assert.equal(result.success, false);
  assert.equal(result.failedEntities.includes('podcast'), true);
  assert.equal(result.rollback?.reason.includes('boom') || result.errors[0]?.message.includes('boom'), true);
  assert.equal(result.rollback?.rolledBackOperations.length, 0);
});
