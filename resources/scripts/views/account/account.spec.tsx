/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AccountQueries from '@/api/account/queries';
import { createExtensionTestHost, renderView, type ExtensionTestHost } from '@/sdk/testing';
import { View } from '../View';

const mocks = vi.hoisted(() => ({
    apiKeys: vi.fn(),
    createApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
    sshKeys: vi.fn(),
    deleteSshKey: vi.fn(),
    updatePassword: vi.fn(),
    twoFactorToken: vi.fn(),
    enableTwoFactor: vi.fn(),
}));

const mutation = (mutateAsync: (...args: never[]) => unknown) => ({ mutateAsync, isPending: false });

vi.mock('@/api/account/api-keys/queries', () => ({
    useAccountApiKeys: () => ({ data: mocks.apiKeys(), error: null, refetch: vi.fn() }),
    useCreateAccountApiKey: () => mutation(mocks.createApiKey),
    useDeleteAccountApiKey: () => mutation(mocks.deleteApiKey),
}));
vi.mock('@/api/account/ssh-keys/queries', () => ({
    useSSHKeys: () => ({ data: mocks.sshKeys(), error: null, refetch: vi.fn() }),
    useCreateSSHKey: () => mutation(vi.fn()),
    useDeleteSSHKey: () => mutation(mocks.deleteSshKey),
}));
vi.mock('@/api/account/two-factor/queries', () => ({
    useAccountTwoFactorToken: (enabled: boolean) => ({
        data: enabled ? mocks.twoFactorToken() : undefined,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
    }),
    useEnableAccountTwoFactor: () => mutation(mocks.enableTwoFactor),
    useDisableAccountTwoFactor: () => mutation(vi.fn()),
}));
vi.mock('@/api/account/queries', async (importOriginal) => ({
    ...(await importOriginal<typeof AccountQueries>()),
    useUpdateAccountPassword: () => mutation(mocks.updatePassword),
}));

let host: ExtensionTestHost | undefined;

beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiKeys.mockReturnValue({ object: 'list', data: [] });
    mocks.sshKeys.mockReturnValue({ object: 'list', data: [] });
});

afterEach(() => {
    cleanup();
    host?.dispose();
    host = undefined;
});

async function renderLive(children: ReactNode) {
    host = createExtensionTestHost({ path: '/account' });

    await act(async () => {
        render(children, { wrapper: host!.Wrapper });
    });
}

describe('account views from fixtures', () => {
    it('composes the overview from its cards, with the two-factor notice when required', () => {
        const { container, unmount } = renderView('page.account.overview', { fixture: 'twoFactorRequired' });

        for (const title of ['更新密码', '更新电子邮箱地址', '两步验证', '需要两步验证']) {
            expect(container).toHaveTextContent(title);
        }

        unmount();
    });

    it('shows a list page error in place of its cards', () => {
        const { container, unmount } = renderView('page.account.api', { fixture: 'error' });

        expect(container).toHaveTextContent('请求失败，状态码 500。');
        expect(container).not.toHaveTextContent('创建 API 密钥');
        unmount();
    });

    it('lists keys in a sortable table with their last use', () => {
        const { container, unmount } = renderView('account.apiKeys.list');

        expect(container).toHaveTextContent('部署脚本');
        expect(container).toHaveTextContent('从未使用');
        expect(within(container).getByRole('button', { name: '按 描述 升序排序' })).toBeInTheDocument();
        unmount();
    });
});

describe('account.password', () => {
    it('validates the confirmation and submits the API body', async () => {
        mocks.updatePassword.mockResolvedValue({});
        await renderLive(<View name='account.password' />);

        expect(screen.getByLabelText('当前密码')).toHaveAttribute('autocomplete', 'current-password');
        expect(screen.getByLabelText('新密码')).toHaveAttribute('autocomplete', 'new-password');

        fireEvent.change(screen.getByLabelText('当前密码'), { target: { value: 'old secret' } });
        fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'new secret' } });
        fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'new secrets' } });

        expect(await screen.findByText('确认密码与您输入的密码不一致。')).toBeVisible();

        fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'new secret' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '更新密码' }));
        });

        expect(mocks.updatePassword).toHaveBeenCalledWith({
            body: { current_password: 'old secret', password: 'new secret', password_confirmation: 'new secret' },
        });
    });
});

describe('account.twoFactor', () => {
    it('enables two-step verification and shows the recovery codes once', async () => {
        mocks.twoFactorToken.mockReturnValue({ data: { secret: 'JBSWY3DPEHPK3PXP', image_url_data: 'otpauth://x' } });
        mocks.enableTwoFactor.mockResolvedValue({ attributes: { tokens: ['aaaa-1111', 'bbbb-2222'] } });
        await renderLive(<View name='account.twoFactor' />);

        fireEvent.click(screen.getByRole('button', { name: '启用两步验证' }));

        const dialog = await screen.findByRole('dialog');

        expect(within(dialog).getByText('JBSW Y3DP EHPK 3PXP')).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: '启用' })).toBeDisabled();
        fireEvent.change(within(dialog).getByPlaceholderText('000000'), { target: { value: '123456' } });
        fireEvent.change(within(dialog).getByLabelText('账户密码'), { target: { value: 'secret' } });
        await act(async () => {
            fireEvent.click(within(dialog).getByRole('button', { name: '启用' }));
        });

        expect(mocks.enableTwoFactor).toHaveBeenCalledWith({ body: { code: '123456', password: 'secret' } });
        const recovery = (await screen.findByText('两步验证已启用')).closest('[role="dialog"]');

        expect(recovery).toHaveTextContent('aaaa-1111');
        expect(recovery).toHaveTextContent('bbbb-2222');
    });
});

describe('account API keys', () => {
    it('shows a created key once', async () => {
        mocks.createApiKey.mockResolvedValue({ attributes: { identifier: 'ptlc_abc' }, meta: { secret_token: 'xyz' } });
        await renderLive(<View name='account.apiKeys.create' />);

        fireEvent.change(screen.getByLabelText('描述'), { target: { value: 'Deploys' } });
        fireEvent.change(screen.getByLabelText('允许的 IP'), { target: { value: '10.0.0.1\n10.0.0.2' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: '创建' }));
        });

        expect(mocks.createApiKey).toHaveBeenCalledWith({
            body: { description: 'Deploys', allowed_ips: ['10.0.0.1', '10.0.0.2'] },
        });
        expect(await screen.findByText('ptlc_abcxyz')).toBeInTheDocument();
        expect(screen.getByLabelText('描述')).toHaveValue('');

        fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        await waitFor(() => expect(screen.queryByText('ptlc_abcxyz')).not.toBeInTheDocument());
    });

    it('deletes a key after confirmation', async () => {
        mocks.apiKeys.mockReturnValue({
            object: 'list',
            data: [
                {
                    object: 'api_key',
                    attributes: {
                        identifier: 'ptlc_abc',
                        description: 'Deploys',
                        allowed_ips: [],
                        last_used_at: null,
                        created_at: '2026-01-01T00:00:00Z',
                    },
                },
            ],
        });
        mocks.deleteApiKey.mockResolvedValue({});
        await renderLive(<View name='account.apiKeys.list' />);

        fireEvent.click(screen.getByRole('button', { name: '删除 API 密钥 Deploys' }));
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: '删除密钥' }));
        });

        expect(mocks.deleteApiKey).toHaveBeenCalledWith({ path: { identifier: 'ptlc_abc' } });
    });
});

describe('account SSH keys', () => {
    it('deletes a key after confirmation', async () => {
        mocks.sshKeys.mockReturnValue({
            object: 'list',
            data: [{ object: 'ssh_key', attributes: { name: 'Laptop', fingerprint: 'abc', created_at: '2026-01-01' } }],
        });
        mocks.deleteSshKey.mockResolvedValue({});
        await renderLive(<View name='account.sshKeys.list' />);

        expect(screen.getAllByText('SHA256:abc')).not.toHaveLength(0);
        fireEvent.click(screen.getByRole('button', { name: '删除 Laptop' }));
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: '删除密钥' }));
        });

        expect(mocks.deleteSshKey).toHaveBeenCalledWith({ body: { fingerprint: 'abc' } });
    });
});
