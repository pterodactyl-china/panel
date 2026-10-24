import type { Query, QueryClient, QueryFilters } from '@tanstack/react-query';
import { hasGeneratedOperationId } from '@/api/queryKeyGuards';

export type ResourceMutationAction = 'create' | 'update' | 'delete';

const resourceMutationCopy = {
    create: { verb: '创建', pastTense: '已创建' },
    update: { verb: '更新', pastTense: '已更新' },
    delete: { verb: '删除', pastTense: '已删除' },
} satisfies Record<ResourceMutationAction, { verb: string; pastTense: string }>;

export const invalidateGeneratedOperations = (
    queryClient: QueryClient,
    operationIds: readonly string[]
): Promise<void> => {
    if (operationIds.length === 0) {
        return Promise.resolve();
    }

    return queryClient.invalidateQueries({
        predicate: ({ queryKey }) => operationIds.some((operationId) => hasGeneratedOperationId(queryKey, operationId)),
    });
};

export const removeQueriesWhenUnobserved = (queryClient: QueryClient, filters: QueryFilters): void => {
    const cache = queryClient.getQueryCache();
    const observed = new Set<Query>();

    for (const query of cache.findAll(filters)) {
        if (query.getObserversCount() === 0) {
            cache.remove(query);
        } else {
            observed.add(query);
        }
    }

    if (observed.size === 0) {
        return;
    }

    const unsubscribe = cache.subscribe((event) => {
        if (!observed.has(event.query)) {
            return;
        }

        if (event.type === 'observerRemoved' && event.query.getObserversCount() === 0) {
            cache.remove(event.query);
        } else if (event.type === 'removed') {
            observed.delete(event.query);
            if (observed.size === 0) {
                unsubscribe();
            }
        }
    });
};

export const resourceMutationMessages = (resource: string, action: ResourceMutationAction, name?: string) => {
    const copy = resourceMutationCopy[action];

    return {
        errorTitle: `无法${copy.verb}${resource}`,
        success: {
            title: `${resource}${copy.pastTense}`,
            description: name ? `${name}${copy.pastTense}。` : `该${resource}${copy.pastTense}。`,
        },
    };
};
