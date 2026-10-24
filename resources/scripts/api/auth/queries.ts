import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    authCompleteLoginCheckpointMutation,
    authLoginMutation,
    authLogoutMutation,
    authRequestPasswordResetEmailMutation,
    authResetPasswordMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import { authGetCsrfCookie } from '@/api/generated/sdk.gen';
import { notifyHttpError } from '@/plugins/notifications';

export const useLogin = () =>
    useMutation({
        ...authLoginMutation(),
        onMutate: async () => {
            await authGetCsrfCookie();
        },
        onError: (error) => notifyHttpError(error, '无法登录'),
    });

export const useLoginCheckpoint = () =>
    useMutation({
        ...authCompleteLoginCheckpointMutation(),
        onError: (error) => notifyHttpError(error, '无法验证两步验证码'),
    });

export const useRequestPasswordResetEmail = () =>
    useMutation({
        ...authRequestPasswordResetEmailMutation(),
        onSuccess: (response) => toast.success(response.status || '密码重置邮件已发送'),
        onError: (error) => notifyHttpError(error, '无法请求重置密码'),
    });

export const usePerformPasswordReset = () =>
    useMutation({
        ...authResetPasswordMutation(),
        onError: (error) => notifyHttpError(error, '无法重置密码'),
    });

export const useLogout = () =>
    useMutation({
        ...authLogoutMutation(),
        onSettled: () => {
            window.location.assign('/');
        },
    });
