/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useImperativeHandle, type Ref } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    RouterProvider,
} from '@tanstack/react-router';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from '@/api/queryClient';
import { siteSettingsQueryKey } from '@/api/settings/queries';
import { renderView } from '@/sdk/testing';
import { View } from '../View';

const mocks = vi.hoisted(() => ({
    login: vi.fn(),
    checkpoint: vi.fn(),
    requestReset: vi.fn(),
    reset: vi.fn(),
    execute: vi.fn<() => Promise<string | null>>(),
}));

vi.mock('@/api/auth/queries', () => ({
    useLogin: () => ({ mutateAsync: mocks.login, isPending: false }),
    useLoginCheckpoint: () => ({ mutateAsync: mocks.checkpoint, isPending: false }),
    useRequestPasswordResetEmail: () => ({ mutateAsync: mocks.requestReset, isPending: false }),
    usePerformPasswordReset: () => ({ mutateAsync: mocks.reset, isPending: false }),
}));

vi.mock('@/components/elements/InvisibleRecaptcha', () => ({
    default: function InvisibleRecaptcha({ ref }: { ref: Ref<{ execute: () => Promise<string | null> }> }) {
        useImperativeHandle(ref, () => ({ execute: mocks.execute }));

        return <div data-testid='recaptcha' />;
    },
}));

const views = {
    '/auth/login': 'page.auth.login',
    '/auth/login/checkpoint': 'page.auth.checkpoint',
    '/auth/password': 'page.auth.password',
    '/auth/password/reset/$token': 'page.auth.passwordReset',
} as const;

let router: ReturnType<typeof createAuthRouter> | undefined;

function createAuthRouter(path: string) {
    const root = createRootRoute({ component: Outlet });

    return createRouter({
        routeTree: root.addChildren(
            Object.entries(views).map(([route, name]) =>
                createRoute({ getParentRoute: () => root, path: route, component: () => <View name={name} /> })
            )
        ),
        history: createMemoryHistory({ initialEntries: [path] }),
    });
}

async function renderAuth(path: string, recaptcha = false) {
    queryClient.setQueryData(siteSettingsQueryKey, {
        name: 'Panel',
        locale: 'en',
        userAvatarsEnabled: false,
        recaptcha: { enabled: recaptcha, siteKey: recaptcha ? 'site-key' : '' },
    });
    router = createAuthRouter(path);

    await act(async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router!} />
            </QueryClientProvider>
        );
    });
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
    queryClient.clear();
    router = undefined;
});

describe('auth views from fixtures', () => {
    it('shows field errors and the disabled state a fixture describes', () => {
        const { container, unmount } = renderView('page.auth.login', { fixture: 'submitting' });

        expect(container.querySelector('input[name="username"]')).toBeDisabled();
        expect(container.querySelector('button[type="submit"]')).toHaveAttribute('aria-busy', 'true');
        unmount();

        const invalid = renderView('page.auth.login', { fixture: 'invalid' });

        expect(invalid.container).toHaveTextContent('必须提供用户名或电子邮箱。');
        expect(invalid.container.querySelector('input[name="password"]')).toHaveAttribute('aria-invalid', 'true');
        invalid.unmount();
    });

    it('mounts the extensions of the login form slot with the route', () => {
        const { container, unmount } = renderView('page.auth.login', {
            slots: { 'auth.login.form.after': ({ data }) => <p>Signing in at {data.pathname}</p> },
        });

        expect(container).toHaveTextContent('Signing in at /auth/login');
        unmount();
    });
});

describe('page.auth.login', () => {
    it('gives password managers the attributes they read', async () => {
        await renderAuth('/auth/login');

        const username = screen.getByLabelText('用户名或电子邮箱');
        const password = screen.getByLabelText('密码');

        expect(username).toHaveAttribute('name', 'username');
        expect(username).toHaveAttribute('autocomplete', 'username');
        expect(password).toHaveAttribute('type', 'password');
        expect(password).toHaveAttribute('autocomplete', 'current-password');
        expect(screen.getByRole('link', { name: '忘记密码？' })).toHaveAttribute('href', '/auth/password');
    });

    it('hands a two-factor login to the checkpoint with its token and destination', async () => {
        mocks.login.mockResolvedValue({ data: { complete: false, confirmation_token: 'confirm-token' } });
        await renderAuth('/auth/login?redirect=%2Fpanel%2Fnodes');

        fireEvent.change(screen.getByLabelText('用户名或电子邮箱'), { target: { value: 'alex' } });
        fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'correct horse' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '登录' }));
        });

        await waitFor(() => expect(router!.state.location.pathname).toBe('/auth/login/checkpoint'));
        expect(mocks.login).toHaveBeenCalledWith({
            body: { user: 'alex', password: 'correct horse', 'g-recaptcha-response': '' },
        });
        expect(router!.state.location.search).toEqual({ redirect: '/panel/nodes' });
        expect(router!.state.location.state).toMatchObject({ token: 'confirm-token' });
    });

    it('validates before submitting', async () => {
        await renderAuth('/auth/login');

        fireEvent.change(screen.getByLabelText('用户名或电子邮箱'), { target: { value: 'alex' } });
        fireEvent.change(screen.getByLabelText('用户名或电子邮箱'), { target: { value: '' } });

        expect(await screen.findByText('必须提供用户名或电子邮箱。')).toBeVisible();
        expect(screen.getByRole('button', { name: '登录' })).toBeDisabled();
        expect(mocks.login).not.toHaveBeenCalled();
    });

    it('sends the reCAPTCHA token, and stops when verification fails', async () => {
        const error = vi.spyOn(toast, 'error').mockImplementation(() => '');

        mocks.login.mockReturnValue(new Promise(() => {}));
        await renderAuth('/auth/login', true);

        expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('用户名或电子邮箱'), { target: { value: 'alex' } });
        fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'secret' } });

        mocks.execute.mockResolvedValueOnce(null);
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '登录' }));
        });

        expect(error).toHaveBeenCalledWith('验证码校验失败，请重试。');
        expect(mocks.login).not.toHaveBeenCalled();

        mocks.execute.mockResolvedValueOnce('captcha-token');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '登录' }));
        });

        expect(mocks.login).toHaveBeenCalledWith({
            body: { user: 'alex', password: 'secret', 'g-recaptcha-response': 'captcha-token' },
        });
    });
});

describe('page.auth.checkpoint', () => {
    it('switches to a recovery code and sends it with the confirmation token', async () => {
        mocks.checkpoint.mockResolvedValue({ data: { complete: false } });
        await renderAuth('/auth/login');
        await act(() => router!.navigate({ to: '/auth/login/checkpoint', state: { token: 'confirm-token' } }));

        const code = screen.getByTitle('验证码');

        expect(code).toHaveAttribute('autocomplete', 'one-time-code');
        fireEvent.click(screen.getByRole('button', { name: '我的设备已丢失' }));

        const recovery = screen.getByTitle('恢复代码');

        expect(recovery).toHaveAttribute('name', 'recoveryCode');
        fireEvent.change(recovery, { target: { value: 'abcd-efgh' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '继续' }));
        });

        expect(mocks.checkpoint).toHaveBeenCalledWith({
            body: { confirmation_token: 'confirm-token', authentication_code: '', recovery_token: 'abcd-efgh' },
        });
    });
});

describe('password reset forms', () => {
    it('requests a reset email and clears the form', async () => {
        mocks.requestReset.mockResolvedValue({});
        await renderAuth('/auth/password');

        const email = screen.getByLabelText('电子邮箱');

        expect(email).toHaveAttribute('autocomplete', 'email');
        fireEvent.change(email, { target: { value: 'alex@example.test' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '发送邮件' }));
        });

        expect(mocks.requestReset).toHaveBeenCalledWith({
            body: { email: 'alex@example.test', 'g-recaptcha-response': '' },
        });
        expect(email).toHaveValue('');
    });

    it('resets with the token and email from the link once the passwords match', async () => {
        mocks.reset.mockReturnValue(new Promise(() => {}));
        await renderAuth('/auth/password/reset/reset-token?email=alex%40example.test');

        expect(screen.getByLabelText('电子邮箱')).toHaveValue('alex@example.test');
        fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'correct horse' } });
        fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'correct' } });

        expect(await screen.findByText('两次输入的新密码不一致。')).toBeVisible();
        expect(screen.getByLabelText('新密码')).toHaveAttribute('autocomplete', 'new-password');

        fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'correct horse' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '重置密码' }));
        });

        expect(mocks.reset).toHaveBeenCalledWith({
            body: {
                email: 'alex@example.test',
                token: 'reset-token',
                password: 'correct horse',
                password_confirmation: 'correct horse',
                'g-recaptcha-response': '',
            },
        });
    });
});
