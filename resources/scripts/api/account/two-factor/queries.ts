import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { setCurrentUserQueryData } from '@/api/account/queries';
import {
    clientDisableTwoFactorAuthenticationMutation,
    clientEnableTwoFactorAuthenticationMutation,
    clientGetTwoFactorSetupOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import { notifyHttpError } from '@/plugins/notifications';

export const useAccountTwoFactorToken = (enabled = true) => useQuery({ ...clientGetTwoFactorSetupOptions(), enabled });

export const useEnableAccountTwoFactor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientEnableTwoFactorAuthenticationMutation(),
        onSuccess: () => {
            setCurrentUserQueryData(queryClient, { useTotp: true });
            toast.success('两步验证已启用');
        },
        onError: (error) => notifyHttpError(error, '无法启用两步验证'),
    });
};

export const useDisableAccountTwoFactor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientDisableTwoFactorAuthenticationMutation(),
        onSuccess: () => {
            setCurrentUserQueryData(queryClient, { useTotp: false });
            toast.success('两步验证已禁用');
        },
        onError: (error) => notifyHttpError(error, '无法禁用两步验证'),
    });
};
