import { queryOptions, useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    invalidateGeneratedOperations,
    removeQueriesWhenUnobserved,
    resourceMutationMessages,
} from '@/api/mutationUtils';
import { fetchAllPages, MAX_PER_PAGE } from '@/api/pagination';
import { withQueryOverrides, type ResourceQueryOverrides } from '@/api/resourceQuery';
import {
    adminCreateEggMutation,
    adminCreateEggVariableMutation,
    adminDeleteEggMutation,
    adminDeleteEggVariableMutation,
    adminExportEggOptions,
    adminGetEggOptions,
    adminGetEggQueryKey,
    adminExportEggQueryKey,
    adminImportEggMutation,
    adminListEggVariablesOptions,
    adminListEggVariablesQueryKey,
    adminUpdateEggFromImportMutation,
    adminUpdateEggInstallScriptMutation,
    adminUpdateEggMutation,
    adminUpdateEggVariableMutation,
    adminListEggsOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import {
    adminListEggs,
    type AdminCreateEggData,
    type AdminCreateEggVariableData,
    type AdminDeleteEggData,
    type AdminDeleteEggVariableData,
    type AdminEggResource,
    type AdminEggVariableResource,
    type AdminImportEggData,
    type AdminUpdateEggData,
    type AdminUpdateEggFromImportData,
    type AdminUpdateEggInstallScriptData,
    type AdminUpdateEggVariableData,
    type Options,
} from '@/api/generated';
import { notifyHttpError } from '@/plugins/notifications';

export type AdminEgg = AdminEggResource;
export type AdminEggVariable = AdminEggVariableResource;
export type AdminEggListItem = AdminEggResource;
export type EggConfigurationBody = AdminCreateEggData['body'];
export type EggScriptBody = AdminUpdateEggInstallScriptData['body'];
export type EggImportBody = AdminUpdateEggFromImportData['body'];
export type EggVariableBody = AdminCreateEggVariableData['body'];

export const createAdminEggInput = (body: EggConfigurationBody): Options<AdminCreateEggData> => ({ body });

export const importAdminEggInput = (body: AdminImportEggData['body']): Options<AdminImportEggData> => ({ body });

export const updateAdminEggInput = (eggId: number, body: AdminUpdateEggData['body']): Options<AdminUpdateEggData> => ({
    path: { egg_id: eggId },
    body,
});

export const updateAdminEggScriptInput = (
    eggId: number,
    body: EggScriptBody
): Options<AdminUpdateEggInstallScriptData> => ({
    path: { egg_id: eggId },
    body,
});

export const updateAdminEggFromFileInput = (
    eggId: number,
    body: EggImportBody
): Options<AdminUpdateEggFromImportData> => ({
    path: { egg_id: eggId },
    body,
});

export const deleteAdminEggInput = (eggId: number, name?: string): Options<AdminDeleteEggData> => ({
    path: { egg_id: eggId },
    meta: name ? { name } : undefined,
});

export const createAdminEggVariableInput = (
    eggId: number,
    body: EggVariableBody
): Options<AdminCreateEggVariableData> => ({
    path: { egg_id: eggId },
    body,
});

export const updateAdminEggVariableInput = (
    eggId: number,
    variableId: number,
    body: AdminUpdateEggVariableData['body']
): Options<AdminUpdateEggVariableData> => ({
    path: { egg_id: eggId, variable_id: variableId },
    body,
});

export const deleteAdminEggVariableInput = (
    eggId: number,
    variableId: number,
    name?: string
): Options<AdminDeleteEggVariableData> => ({
    path: { egg_id: eggId, variable_id: variableId },
    meta: name ? { name } : undefined,
});

const adminEggsInput = { query: { sort: 'id', per_page: MAX_PER_PAGE } } as const;

const adminEggInput = (eggId: number): Parameters<typeof adminGetEggOptions>[0] => ({
    path: { egg_id: eggId },
    query: { include: 'tags' },
});

const adminEggVariablesInput = (eggId: number): Parameters<typeof adminListEggVariablesOptions>[0] => ({
    path: { egg_id: eggId },
});

export const adminEggDetailKey = (eggId: number) => adminGetEggQueryKey({ path: { egg_id: eggId } });
const adminEggVariableListQueryKey = (eggId: number) => adminListEggVariablesQueryKey(adminEggVariablesInput(eggId));

// The complete egg list: pickers and the eggs page need every egg, so all pages are loaded.
export const adminEggsQueryOptions = () =>
    queryOptions({
        ...adminListEggsOptions(adminEggsInput),
        queryFn: ({ signal }) =>
            fetchAllPages(
                async (page) => (await adminListEggs({ query: { ...adminEggsInput.query, page }, signal })).data,
                signal
            ),
    });

export const adminEggQueryOptions = (eggId: number) => ({
    ...adminGetEggOptions(adminEggInput(eggId)),
    enabled: Number.isInteger(eggId) && eggId > 0,
});

export const adminEggVariablesQueryOptions = (eggId: number) => ({
    ...adminListEggVariablesOptions(adminEggVariablesInput(eggId)),
    enabled: Number.isInteger(eggId) && eggId > 0,
});

const adminEggExportQueryOptions = (eggId: number) => ({
    ...adminExportEggOptions({ path: { egg_id: eggId } }),
    enabled: false,
});

export const useAdminEggs = () => useQuery(adminEggsQueryOptions());

export const useAdminEgg = (eggId: number, options?: ResourceQueryOverrides) =>
    useQuery(withQueryOverrides(adminEggQueryOptions(eggId), options));

export const useAdminEggVariables = (eggId: number, options?: ResourceQueryOverrides) =>
    useQuery(withQueryOverrides(adminEggVariablesQueryOptions(eggId), options));

const adminEggListOperations = ['adminListEggs'];

const invalidateAdminEggVariables = (queryClient: QueryClient, eggId: number) =>
    Promise.all([
        queryClient.invalidateQueries({ queryKey: adminEggVariableListQueryKey(eggId) }),
        queryClient.invalidateQueries({ queryKey: adminEggDetailKey(eggId) }),
    ]);

export const useImportAdminEgg = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminImportEggMutation(),
        onSuccess: async (egg) => {
            await invalidateGeneratedOperations(queryClient, adminEggListOperations);
            toast.success('预设已导入', {
                description: `${egg.attributes.name} 已从上传的文件中导入。`,
            });
        },
        onError: (error) => notifyHttpError(error, '无法导入预设'),
    });
};

export const useCreateAdminEgg = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminCreateEggMutation(),
        onSuccess: async (egg) => {
            await Promise.all([
                invalidateGeneratedOperations(queryClient, adminEggListOperations),
                queryClient.invalidateQueries({ queryKey: adminEggDetailKey(egg.attributes.id) }),
            ]);
            const messages = resourceMutationMessages('预设', 'create', egg.attributes.name);

            toast.success(messages.success.title, { description: messages.success.description });
        },
        onError: (error) => notifyHttpError(error, resourceMutationMessages('预设', 'create').errorTitle),
    });
};

export const useUpdateAdminEgg = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateEggMutation(),
        onSuccess: async (egg) => {
            await Promise.all([
                invalidateGeneratedOperations(queryClient, adminEggListOperations),
                queryClient.invalidateQueries({ queryKey: adminEggDetailKey(egg.attributes.id) }),
            ]);
            const messages = resourceMutationMessages('预设', 'update', egg.attributes.name);

            toast.success(messages.success.title, { description: messages.success.description });
        },
        onError: (error) => notifyHttpError(error, resourceMutationMessages('预设', 'update').errorTitle),
    });
};

export const useUpdateAdminEggScript = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateEggInstallScriptMutation(),
        onSuccess: async (egg) => {
            await Promise.all([
                invalidateGeneratedOperations(queryClient, adminEggListOperations),
                queryClient.invalidateQueries({ queryKey: adminEggDetailKey(egg.attributes.id) }),
            ]);
            toast.success('安装脚本已更新', {
                description: `${egg.attributes.name} 的安装脚本已更新。`,
            });
        },
        onError: (error) => notifyHttpError(error, '无法更新安装脚本'),
    });
};

export const useUpdateAdminEggFromFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateEggFromImportMutation(),
        onSuccess: async (egg) => {
            await Promise.all([
                invalidateGeneratedOperations(queryClient, adminEggListOperations),
                queryClient.invalidateQueries({ queryKey: adminEggDetailKey(egg.attributes.id) }),
            ]);
            toast.success('预设已更新', {
                description: `${egg.attributes.name} 已根据上传的文件更新。`,
            });
        },
        onError: (error) => notifyHttpError(error, '无法通过文件更新预设'),
    });
};

export const useExportAdminEgg = (eggId: number) => useQuery(adminEggExportQueryOptions(eggId));

export const useDeleteAdminEgg = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminDeleteEggMutation(),
        onSuccess: async (_data, variables) => {
            const eggId = variables.path.egg_id;

            removeQueriesWhenUnobserved(queryClient, { queryKey: adminEggDetailKey(eggId) });
            removeQueriesWhenUnobserved(queryClient, { queryKey: adminEggVariableListQueryKey(eggId) });
            removeQueriesWhenUnobserved(queryClient, { queryKey: adminExportEggQueryKey({ path: { egg_id: eggId } }) });
            await invalidateGeneratedOperations(queryClient, adminEggListOperations);
            const name = variables.meta?.name;
            const messages = resourceMutationMessages('预设', 'delete', name);

            toast.success(messages.success.title, { description: messages.success.description });
        },
        onError: (error) => notifyHttpError(error, resourceMutationMessages('预设', 'delete').errorTitle),
    });
};

export const useCreateAdminEggVariable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminCreateEggVariableMutation(),
        onSuccess: async (variable, variables) => {
            await invalidateAdminEggVariables(queryClient, variables.path.egg_id);
            const messages = resourceMutationMessages('变量', 'create', variable.attributes.name);

            toast.success(messages.success.title, { description: messages.success.description });
        },
        onError: (error) => notifyHttpError(error, resourceMutationMessages('变量', 'create').errorTitle),
    });
};

export const useUpdateAdminEggVariable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateEggVariableMutation(),
        onSuccess: async (variable, variables) => {
            await invalidateAdminEggVariables(queryClient, variables.path.egg_id);
            const messages = resourceMutationMessages('变量', 'update', variable.attributes.name);

            toast.success(messages.success.title, { description: messages.success.description });
        },
        onError: (error) => notifyHttpError(error, resourceMutationMessages('变量', 'update').errorTitle),
    });
};

export const useDeleteAdminEggVariable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminDeleteEggVariableMutation(),
        onSuccess: async (_data, variables) => {
            await invalidateAdminEggVariables(queryClient, variables.path.egg_id);
            const name = variables.meta?.name;
            const messages = resourceMutationMessages('变量', 'delete', name);

            toast.success(messages.success.title, { description: messages.success.description });
        },
        onError: (error) => notifyHttpError(error, resourceMutationMessages('变量', 'delete').errorTitle),
    });
};
