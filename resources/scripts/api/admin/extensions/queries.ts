import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import { toast } from 'sonner';

import {
    adminClearExtensionSettingFileMutation,
    adminDisableExtensionMutation,
    adminEnableExtensionMutation,
    adminGetExtensionSettingsOptions,
    adminGetExtensionSettingsQueryKey,
    adminInstallExtensionMutation,
    adminListExtensionFormsOptions,
    adminListExtensionsOptions,
    adminListExtensionsQueryKey,
    adminRemoveExtensionMutation,
    adminUpdateExtensionSettingsMutation,
    adminUploadExtensionSettingFileMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
    AdminClearExtensionSettingFileData,
    AdminExtensionFormsResponse,
    AdminDisableExtensionData,
    AdminEnableExtensionData,
    AdminGetExtensionSettingsResponse,
    AdminInstallExtensionData,
    AdminListExtensionsResponse,
    AdminRemoveExtensionData,
    AdminUpdateExtensionSettingsData,
    AdminUploadExtensionSettingFileData,
    Options,
} from '@/api/generated';
import { isObject, isString } from '@/lib/objects';
import { notifyHttpError } from '@/plugins/notifications';

export type AdminExtensionsResponse = AdminListExtensionsResponse;
export type AdminExtension = NonNullable<AdminExtensionsResponse['data']>[number];

type AdminExtensionsQueryOptions = { enabled?: boolean };

export const adminExtensionsQueryOptions = () => adminListExtensionsOptions();

/** The extensions whose fields each admin form shows, keyed by form. */
export type AdminExtensionForms = AdminExtensionFormsResponse['data'];

/** Changes only when extensions are enabled or disabled, which asks for a reload. */
export const adminExtensionFormsQueryOptions = (): ReturnType<typeof adminListExtensionFormsOptions> => ({
    ...adminListExtensionFormsOptions(),
    staleTime: Infinity,
});

export const installAdminExtensionInput = (
    file: File,
    enable: boolean,
    replace = false
): Options<AdminInstallExtensionData> => ({
    body: { package: file, enable, replace },
});

/** The installed extension an uploaded package would replace, which the admin has to confirm. */
export type AdminExtensionReplacement = {
    id: string;
    version: string;
    installedVersion: string | null;
    enabled: boolean;
};

/** The `meta` object of the first JSON:API error in a response body. */
const firstErrorMeta = (response: AxiosResponse): unknown => {
    const data: unknown = response.data;
    const first: unknown = isObject(data) && 'errors' in data && Array.isArray(data.errors) ? data.errors[0] : null;

    return isObject(first) && 'meta' in first ? first.meta : null;
};

/** Reads the 409 the install endpoint answers with when the package's id is already installed. */
export const extensionReplacement = (cause: unknown): AdminExtensionReplacement | null => {
    if (!isAxiosError(cause) || cause.response?.status !== 409) {
        return null;
    }

    const meta = firstErrorMeta(cause.response);

    if (!isObject(meta) || !('identifier' in meta) || !('version' in meta) || !isString(meta.identifier)) {
        return null;
    }

    const installed = 'installed_version' in meta ? meta.installed_version : null;

    return {
        id: meta.identifier,
        version: isString(meta.version) ? meta.version : '',
        installedVersion: isString(installed) ? installed : null,
        enabled: 'enabled' in meta && meta.enabled === true,
    };
};

export const enableAdminExtensionInput = (extension: string): Options<AdminEnableExtensionData> => ({
    path: { extension },
    meta: { name: extension },
});

export const disableAdminExtensionInput = (extension: string): Options<AdminDisableExtensionData> => ({
    path: { extension },
    meta: { name: extension },
});

export const removeAdminExtensionInput = (extension: string, name?: string): Options<AdminRemoveExtensionData> => ({
    path: { extension },
    meta: { name: name ?? extension },
});

export type AdminExtensionSettingField = AdminGetExtensionSettingsResponse['data']['schema'][number];
export type AdminExtensionSettingValue = AdminExtensionSettingField['value'];

export const adminExtensionSettingsQueryOptions = (
    extension: string
): ReturnType<typeof adminGetExtensionSettingsOptions> => adminGetExtensionSettingsOptions({ path: { extension } });

export const updateAdminExtensionSettingsInput = (
    extension: string,
    settings: Record<string, AdminExtensionSettingValue>
): Options<AdminUpdateExtensionSettingsData> => ({
    path: { extension },
    body: { settings },
    meta: { name: extension },
});

export const uploadAdminExtensionSettingFileInput = (
    extension: string,
    input: string,
    file: File
): Options<AdminUploadExtensionSettingFileData> => ({
    path: { extension, input },
    body: { file },
});

export const clearAdminExtensionSettingFileInput = (
    extension: string,
    input: string
): Options<AdminClearExtensionSettingFileData> => ({
    path: { extension, input },
});

export const useAdminExtensions = (options?: AdminExtensionsQueryOptions) =>
    useQuery({ ...adminExtensionsQueryOptions(), ...options });

export const useAdminExtensionForms = (options?: AdminExtensionsQueryOptions) =>
    useQuery({ ...adminExtensionFormsQueryOptions(), ...options });

export const useAdminExtensionSettings = (extension: string, options?: { enabled?: boolean }) =>
    useQuery({ ...adminExtensionSettingsQueryOptions(extension), ...options });

export const useUpdateAdminExtensionSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateExtensionSettingsMutation(),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: adminGetExtensionSettingsQueryKey({
                    path: { extension: variables.path.extension },
                }),
            });
            const name = variables.meta?.name ?? 'the extension';

            toast.success('设置已保存', { description: `${name} 的设置已更新。` });
        },
        onError: (error) => notifyHttpError(error, '无法更新扩展设置'),
    });
};

export const useUploadAdminExtensionSettingFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUploadExtensionSettingFileMutation(),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(
                adminGetExtensionSettingsQueryKey({ path: { extension: variables.path.extension } }),
                data
            );
            toast.success('文件已上传');
        },
        onError: (error) => notifyHttpError(error, '无法上传文件'),
    });
};

export const useClearAdminExtensionSettingFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminClearExtensionSettingFileMutation(),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(
                adminGetExtensionSettingsQueryKey({ path: { extension: variables.path.extension } }),
                data
            );
            toast.success('文件已删除');
        },
        onError: (error) => notifyHttpError(error, '无法删除该文件'),
    });
};

const notifyReloadToApply = (title: string, description: string) =>
    toast.success(title, {
        description: `${description} 刷新页面即可生效。`,
        action: { label: '重新加载', onClick: () => window.location.reload() },
    });

export const useInstallAdminExtension = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminInstallExtensionMutation(),
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: adminListExtensionsQueryKey() });
            const description = `${data.data?.name ?? 'The extension'} has been installed.`;

            if (data.data?.enabled) {
                notifyReloadToApply('扩展已安装', description);
            } else {
                toast.success('扩展已安装', { description });
            }
        },
        onError: (error) => {
            // The install dialog asks the admin to confirm a replacement instead.
            if (!extensionReplacement(error)) {
                notifyHttpError(error, '无法安装扩展');
            }
        },
    });
};

export const useEnableAdminExtension = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminEnableExtensionMutation(),
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({ queryKey: adminListExtensionsQueryKey() });
            const fallback = variables.meta?.name ?? 'The extension';

            notifyReloadToApply('扩展已启用', `${data.data?.name ?? fallback} 已启用。`);
        },
        onError: (error) => notifyHttpError(error, '无法启用扩展'),
    });
};

export const useDisableAdminExtension = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminDisableExtensionMutation(),
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({ queryKey: adminListExtensionsQueryKey() });
            const fallback = variables.meta?.name ?? 'The extension';

            notifyReloadToApply('扩展已禁用', `${data.data?.name ?? fallback} 已禁用。`);
        },
        onError: (error) => notifyHttpError(error, '无法禁用扩展'),
    });
};

export const useRemoveAdminExtension = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminRemoveExtensionMutation(),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({ queryKey: adminListExtensionsQueryKey() });
            const name = variables.meta?.name ?? 'The extension';

            notifyReloadToApply('扩展已移除', `${name} has been removed.`);
        },
        onError: (error) => notifyHttpError(error, '无法移除扩展'),
    });
};
