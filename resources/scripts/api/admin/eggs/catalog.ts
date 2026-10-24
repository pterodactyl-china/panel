import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    adminImportCatalogEggMutation,
    adminListEggCatalogOptions,
    adminListEggCatalogQueryKey,
    adminRefreshEggCatalogMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type { AdminImportCatalogEggData, AdminListEggCatalogResponse, Options } from '@/api/generated';
import { invalidateGeneratedOperations } from '@/api/mutationUtils';

import { notifyHttpError } from '@/plugins/notifications';

export type EggCatalogEntry = NonNullable<AdminListEggCatalogResponse['data']>[number];

export const adminEggCatalogQueryOptions = () => ({
    ...adminListEggCatalogOptions(),
    staleTime: 5 * 60 * 1000,
    retry: false,
});

export const useAdminEggCatalog = () => useQuery(adminEggCatalogQueryOptions());

export const importAdminCatalogEggInput = (catalogId: string): Options<AdminImportCatalogEggData> => ({
    body: { catalog_id: catalogId },
});

export const useImportAdminCatalogEgg = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminImportCatalogEggMutation(),
        onSuccess: async (egg) => {
            await invalidateGeneratedOperations(queryClient, ['adminListEggs']);
            toast.success('预设已导入', { description: `${egg.attributes.name} 已从预设目录添加。` });
        },
        onError: (error) => notifyHttpError(error, '无法导入预设目录中的预设'),
    });
};

export const useRefreshAdminEggCatalog = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminRefreshEggCatalogMutation(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminListEggCatalogQueryKey() }),
        onError: (error) => notifyHttpError(error, '无法刷新预设目录'),
    });
};
