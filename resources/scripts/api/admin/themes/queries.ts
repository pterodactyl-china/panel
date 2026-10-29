import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    adminActivateThemeMutation,
    adminClearThemeImageMutation,
    adminGetThemeSettingsOptions,
    adminGetThemeSettingsQueryKey,
    adminListThemesOptions,
    adminListThemesQueryKey,
    adminPreviewThemeMutation,
    adminStopThemePreviewMutation,
    adminUpdateThemeSettingsMutation,
    adminUploadThemeImageMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
    AdminActivateThemeData,
    AdminClearThemeImageData,
    AdminGetThemeSettingsResponse,
    AdminListThemesResponse,
    AdminPreviewThemeData,
    AdminUpdateThemeSettingsData,
    AdminUploadThemeImageData,
    Options,
} from '@/api/generated';
import { notifyHttpError } from '@/plugins/notifications';

export type AdminThemesResponse = AdminListThemesResponse;
export type AdminThemeSettingsResponse = AdminGetThemeSettingsResponse;
export type AdminTheme = AdminListThemesResponse['data'][number]['attributes'];
export type AdminThemesMeta = NonNullable<AdminListThemesResponse['meta']>;
export type AdminThemeSetting = AdminGetThemeSettingsResponse['data'][number]['attributes'];
export type AdminThemeSettingValue = AdminThemeSetting['value'];

export const adminThemesQueryOptions = () => adminListThemesOptions();

export const adminThemeSettingsQueryOptions = (theme: string): ReturnType<typeof adminGetThemeSettingsOptions> =>
    adminGetThemeSettingsOptions({ path: { theme } });

export const activateAdminThemeInput = (theme: string, name: string): Options<AdminActivateThemeData> => ({
    path: { theme },
    meta: { name },
});

export const previewAdminThemeInput = (theme: string, name: string): Options<AdminPreviewThemeData> => ({
    path: { theme },
    meta: { name },
});

export const updateAdminThemeSettingsInput = (
    theme: string,
    settings: Record<string, AdminThemeSettingValue>
): Options<AdminUpdateThemeSettingsData> => ({
    path: { theme },
    body: { settings },
});

export const uploadAdminThemeImageInput = (
    theme: string,
    setting: string,
    file: File
): Options<AdminUploadThemeImageData> => ({
    path: { theme, setting },
    body: { file },
});

export const clearAdminThemeImageInput = (theme: string, setting: string): Options<AdminClearThemeImageData> => ({
    path: { theme, setting },
});

export const useAdminThemes = () => useQuery(adminThemesQueryOptions());

export const useAdminThemeSettings = (theme: string, options?: { enabled?: boolean }) =>
    useQuery({ ...adminThemeSettingsQueryOptions(theme), ...options });

/** A theme applies from the next page load on, so changing it offers a reload. */
const notifyReloadToApply = (title: string, description: string) =>
    toast.success(title, {
        description: `${description} 刷新页面即可查看。`,
        action: { label: '重新加载', onClick: () => window.location.reload() },
    });

const useThemeListMutation = () => {
    const queryClient = useQueryClient();

    return () => queryClient.invalidateQueries({ queryKey: adminListThemesQueryKey() });
};

export const useActivateAdminTheme = () => {
    const invalidate = useThemeListMutation();

    return useMutation({
        ...adminActivateThemeMutation(),
        onSuccess: async (_data, variables) => {
            await invalidate();
            notifyReloadToApply('主题已激活', `${String(variables.meta?.name ?? 'The theme')} 已激活。`);
        },
        onError: (error) => notifyHttpError(error, '无法激活主题'),
    });
};

export const usePreviewAdminTheme = () => {
    const invalidate = useThemeListMutation();

    return useMutation({
        ...adminPreviewThemeMutation(),
        onSuccess: async (_data, variables) => {
            await invalidate();
            notifyReloadToApply(
                '正在预览主题',
                `在停止预览之前，只有您能看到 ${String(variables.meta?.name ?? '该主题')}。`
            );
        },
        onError: (error) => notifyHttpError(error, '无法预览主题'),
    });
};

export const useStopAdminThemePreview = () => {
    const invalidate = useThemeListMutation();

    return useMutation({
        ...adminStopThemePreviewMutation(),
        onSuccess: async () => {
            await invalidate();
            notifyReloadToApply('已停止预览', '已恢复显示当前启用的主题。');
        },
        onError: (error) => notifyHttpError(error, '无法停止预览'),
    });
};

/** The settings endpoints answer with the fresh settings, which replace the cached ones. */
const useThemeSettingsMutation = () => {
    const queryClient = useQueryClient();

    return (data: AdminGetThemeSettingsResponse, theme: string | undefined) =>
        queryClient.setQueryData(adminGetThemeSettingsQueryKey({ path: { theme: theme ?? '' } }), data);
};

export const useUpdateAdminThemeSettings = () => {
    const store = useThemeSettingsMutation();

    return useMutation({
        ...adminUpdateThemeSettingsMutation(),
        onSuccess: (data, variables) => {
            store(data, variables.path.theme);
            notifyReloadToApply('主题设置已保存', '此后页面将使用这些设置渲染。');
        },
        onError: (error) => notifyHttpError(error, '无法保存主题设置'),
    });
};

export const useUploadAdminThemeImage = () => {
    const store = useThemeSettingsMutation();

    return useMutation({
        ...adminUploadThemeImageMutation(),
        onSuccess: (data, variables) => {
            store(data, variables.path.theme);
            notifyReloadToApply('图片已上传', '此后页面将使用它渲染。');
        },
        onError: (error) => notifyHttpError(error, '无法上传图片'),
    });
};

export const useClearAdminThemeImage = () => {
    const store = useThemeSettingsMutation();

    return useMutation({
        ...adminClearThemeImageMutation(),
        onSuccess: (data, variables) => {
            store(data, variables.path.theme);
            notifyReloadToApply('图片已移除', '此后页面将不再使用它渲染。');
        },
        onError: (error) => notifyHttpError(error, '无法移除图片'),
    });
};
