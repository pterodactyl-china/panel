import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    adminGetSettingsOptions,
    adminGetSettingsQueryKey,
    adminSendTestMailMutation,
    adminUpdateAdvancedSettingsMutation,
    adminUpdateGeneralSettingsMutation,
    adminUpdateMailSettingsMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
    AdminGetSettingsResponse,
    AdminSendTestMailData,
    AdminUpdateAdvancedSettingsData,
    AdminUpdateGeneralSettingsData,
    AdminUpdateMailSettingsData,
    Options,
} from '@/api/generated';
import { setSiteSettingsQueryData } from '@/api/settings/queries';
import { notifyHttpError } from '@/plugins/notifications';

export type AdminSettings = AdminGetSettingsResponse;
type AdminGeneralSettingsBody = AdminUpdateGeneralSettingsData['body'];
type AdminMailSettingsBody = NonNullable<AdminUpdateMailSettingsData['body']>;
type AdminMailSmtpSettingsBody = NonNullable<AdminMailSettingsBody['smtp']>;
type AdminAdvancedSettingsBody = AdminUpdateAdvancedSettingsData['body'];
type UpdateAdminMailSettingsOptions = { successNotification?: boolean };
type AdminSettingsSection = 'Advanced' | 'General' | 'Mail';

export interface GeneralSettingsValues {
    name: string;
    twoFactorRequired: NonNullable<AdminGeneralSettingsBody['misc']>['required_2fa'];
    userAvatarsEnabled: boolean;
    locale: string;
}

export interface MailSettingsValues {
    host: string;
    port: number;
    encryption: NonNullable<AdminMailSmtpSettingsBody['encryption']> | '';
    username: string;
    // Blank keeps the existing password; "!e" clears it.
    password: string;
    fromAddress: string;
    fromName: string;
}

export interface AdvancedSettingsValues {
    recaptchaEnabled: boolean;
    recaptchaSecretKey: string;
    recaptchaWebsiteKey: string;
    guzzleTimeout: number;
    guzzleConnectTimeout: number;
    allocationsEnabled: boolean;
    allocationsRangeStart:
        | NonNullable<AdminAdvancedSettingsBody['pterodactyl:client_features:allocations:range_start']>
        | '';
    allocationsRangeEnd:
        | NonNullable<AdminAdvancedSettingsBody['pterodactyl:client_features:allocations:range_end']>
        | '';
}

const adminMailSettingsBody = (values: MailSettingsValues): AdminMailSettingsBody => ({
    smtp: {
        host: values.host,
        port: values.port,
        encryption: values.encryption === '' ? null : values.encryption,
        username: values.username,
        password: values.password,
        from_address: values.fromAddress,
        from_name: values.fromName,
    },
});

export const updateAdminGeneralSettingsInput = (
    values: GeneralSettingsValues
): Options<AdminUpdateGeneralSettingsData> => ({
    body: {
        branding: { name: values.name },
        misc: {
            required_2fa: values.twoFactorRequired,
            user_avatars_enabled: values.userAvatarsEnabled ? 'true' : 'false',
        },
        default_locale: values.locale,
    },
});

export const updateAdminMailSettingsInput = (values: MailSettingsValues): Options<AdminUpdateMailSettingsData> => ({
    body: adminMailSettingsBody(values),
});

export const updateAdminAdvancedSettingsInput = (
    values: AdvancedSettingsValues
): Options<AdminUpdateAdvancedSettingsData> => ({
    body: {
        'recaptcha:enabled': values.recaptchaEnabled ? 'true' : 'false',
        'recaptcha:secret_key': values.recaptchaSecretKey === '' ? null : values.recaptchaSecretKey,
        'recaptcha:website_key': values.recaptchaWebsiteKey,
        'pterodactyl:guzzle:timeout': values.guzzleTimeout,
        'pterodactyl:guzzle:connect_timeout': values.guzzleConnectTimeout,
        'pterodactyl:client_features:allocations:enabled': values.allocationsEnabled ? 'true' : 'false',
        'pterodactyl:client_features:allocations:range_start':
            values.allocationsRangeStart === '' ? null : values.allocationsRangeStart,
        'pterodactyl:client_features:allocations:range_end':
            values.allocationsRangeEnd === '' ? null : values.allocationsRangeEnd,
    },
});

export const testAdminMailInput = (): Options<AdminSendTestMailData> => ({});

export const adminSettingsQueryOptions = () => adminGetSettingsOptions();

type AdminSettingsQueryOptions = { enabled?: boolean };
const adminSettingsUpdateToast = (section: AdminSettingsSection) => ({
    title: `${section}设置已更新`,
    description: `${section}设置已更新。`,
});

export const useAdminSettings = (options?: AdminSettingsQueryOptions) =>
    useQuery({ ...adminSettingsQueryOptions(), ...options });

export const useUpdateAdminGeneralSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateGeneralSettingsMutation(),
        onSuccess: async (_data, { body }) => {
            setSiteSettingsQueryData(queryClient, (settings) => ({
                ...settings,
                name: body.branding?.name ?? settings.name,
                locale: body.default_locale,
                userAvatarsEnabled: body.misc?.user_avatars_enabled === 'true',
            }));
            await queryClient.invalidateQueries({ queryKey: adminGetSettingsQueryKey() });
            const notification = adminSettingsUpdateToast('General');

            toast.success(notification.title, { description: notification.description });
        },
        onError: (error) => notifyHttpError(error, '无法更新常规设置'),
    });
};

export const useUpdateAdminMailSettings = ({ successNotification = true }: UpdateAdminMailSettingsOptions = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateMailSettingsMutation(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: adminGetSettingsQueryKey() });
            if (successNotification) {
                const notification = adminSettingsUpdateToast('Mail');

                toast.success(notification.title, { description: notification.description });
            }
        },
        onError: (error) => notifyHttpError(error, '无法更新邮件设置'),
    });
};

export const useSendTestAdminMail = () =>
    useMutation({
        ...adminSendTestMailMutation(),
        onSuccess: () =>
            toast.success('邮件设置测试完成', {
                description: '邮件设置已保存，测试邮件已发送到您的账户。',
            }),
        onError: (error) => notifyHttpError(error, '无法测试邮件设置'),
    });

export const useUpdateAdminAdvancedSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...adminUpdateAdvancedSettingsMutation(),
        onSuccess: async (_data, { body }) => {
            setSiteSettingsQueryData(queryClient, (settings) => ({
                ...settings,
                recaptcha: {
                    enabled: body['recaptcha:enabled'] === 'true',
                    siteKey: body['recaptcha:website_key'],
                },
            }));
            await queryClient.invalidateQueries({ queryKey: adminGetSettingsQueryKey() });
            const notification = adminSettingsUpdateToast('Advanced');

            toast.success(notification.title, { description: notification.description });
        },
        onError: (error) => notifyHttpError(error, '无法更新高级设置'),
    });
};
