// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import http from '@/api/http';
import { adminEggsQueryOptions, type AdminEgg } from '@/api/admin/eggs/queries';
import EggsContainer from '@/components/admin/eggs/EggsContainer';
import UpdateEggFromFileButton from '@/components/admin/eggs/UpdateEggFromFileButton';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), notifyError: vi.fn(), toastSuccess: vi.fn() }));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mocks.navigate,
    Link: ({ to, params: _params, ...props }: ComponentProps<'a'> & { to: string; params?: object }) => (
        <a href={to} {...props} />
    ),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock('@/plugins/notifications', () => ({ notifyHttpError: mocks.notifyError }));

const egg: AdminEgg = {
    object: 'egg',
    attributes: {
        id: 42,
        uuid: 'egg-uuid',
        name: 'Imported Paper',
        author: 'author@example.com',
        description: null,
        features: null,
        docker_image: 'java:21',
        docker_images: { Java: 'java:21' },
        force_outgoing_ip: false,
        config: { files: {}, startup: {}, stop: 'stop', logs: {}, file_denylist: [], extends: null },
        startup: 'java -jar server.jar',
        script: { privileged: false, install: '', entry: 'bash', container: 'alpine', extends: null },
        created_at: '2026-09-15T00:00:00Z',
        updated_at: '2026-09-15T00:00:00Z',
    },
};
const eggFile = () => new File(['{"name":"Paper"}'], 'egg-paper.json', { type: 'application/json' });
const response = (config: InternalAxiosRequestConfig): AxiosResponse<AdminEgg> => ({
    data: egg,
    status: 201,
    statusText: 'Created',
    headers: {},
    config,
});
const originalAdapter = http.defaults.adapter;
const upload = vi.fn<(config: InternalAxiosRequestConfig) => Promise<AxiosResponse<AdminEgg>>>();

const setup = (children: ReactNode = <EggsContainer />) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
    });

    queryClient.setQueryData(adminEggsQueryOptions().queryKey, {
        object: 'list',
        data: [],
        meta: { pagination: { total: 0, count: 0, per_page: 100, current_page: 1, total_pages: 1 } },
    });
    render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);

    return { queryClient, user: userEvent.setup() };
};

describe('egg file uploads', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        upload.mockReset();
        http.defaults.adapter = async (config) => {
            if (config.method === 'get') {
                return {
                    ...response(config),
                    data: {
                        object: 'list',
                        data: [egg],
                        meta: { pagination: { total: 1, count: 1, per_page: 100, current_page: 1, total_pages: 1 } },
                    },
                };
            }

            return upload(config);
        };
    });

    afterEach(() => {
        cleanup();
        http.defaults.adapter = originalAdapter;
    });

    it('imports from the Eggs page, blocks dismissal during upload, and refreshes the list', async () => {
        const { queryClient, user } = setup();
        let finishImport = () => {};

        const imported = new Promise<void>((resolve) => {
            finishImport = resolve;
        });

        upload.mockImplementation(async (config) => {
            await imported;

            return response(config);
        });
        await user.click(screen.getByRole('button', { name: '导入预设' }));
        const dialog = await screen.findByRole('dialog', { name: '导入预设' });
        const submit = within(dialog).getByRole('button', { name: '导入预设' });

        expect(submit).toBeDisabled();

        const file = eggFile();

        await user.upload(within(dialog).getByLabelText('预设文件'), file);
        await user.click(submit);

        await waitFor(() => expect(upload).toHaveBeenCalledOnce());
        const request = upload.mock.calls[0]![0];

        expect(request.url).toBe('/api/admin/eggs/import');
        expect(request.method).toBe('post');
        expect(request.data).toBeInstanceOf(FormData);
        expect((request.data as FormData).get('import_file')).toBe(file);
        expect(submit).toBeDisabled();
        expect(within(dialog).getByRole('button', { name: '取消' })).toBeDisabled();
        await user.keyboard('{Escape}');
        expect(dialog).toBeInTheDocument();

        await act(async () => finishImport());

        await waitFor(() =>
            expect(mocks.navigate).toHaveBeenCalledWith({
                to: '/panel/eggs/$eggId',
                params: { eggId: 42 },
            })
        );
        await waitFor(() => expect(queryClient.getQueryData(adminEggsQueryOptions().queryKey)?.data).toEqual([egg]));
        expect(mocks.toastSuccess).toHaveBeenCalledWith('预设已导入', expect.anything());
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps a failed upload open so the selected file can be retried', async () => {
        const { user } = setup();
        const error = new AxiosError('Invalid egg file');

        upload.mockRejectedValueOnce(error).mockImplementation(async (config) => response(config));
        await user.click(screen.getByRole('button', { name: '导入预设' }));
        const dialog = await screen.findByRole('dialog');

        await user.upload(within(dialog).getByLabelText('预设文件'), eggFile());
        const submit = within(dialog).getByRole('button', { name: '导入预设' });

        await user.click(submit);

        await waitFor(() => expect(mocks.notifyError).toHaveBeenCalledWith(error, '无法导入预设'));
        expect(dialog).toBeInTheDocument();
        expect(mocks.navigate).not.toHaveBeenCalled();
        await waitFor(() => expect(submit).toBeEnabled());
        await user.click(submit);
        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledOnce());
    });

    it('clears the selected file when an import is cancelled', async () => {
        const { user } = setup();

        await user.click(screen.getByRole('button', { name: '导入预设' }));
        const dialog = await screen.findByRole('dialog');

        await user.upload(within(dialog).getByLabelText('预设文件'), eggFile());
        await user.click(within(dialog).getByRole('button', { name: '取消' }));
        await user.click(screen.getByRole('button', { name: '导入预设' }));

        const reopened = await screen.findByRole('dialog');

        expect(within(reopened).getByRole('button', { name: '导入预设' })).toBeDisabled();
        expect(upload).not.toHaveBeenCalled();
    });

    it('updates the existing egg through the shared file dialog', async () => {
        const { user } = setup(<UpdateEggFromFileButton egg={egg} />);

        upload.mockImplementation(async (config) => response(config));
        await user.click(screen.getByRole('button', { name: '从文件更新' }));
        const dialog = await screen.findByRole('dialog', { name: '通过文件更新预设' });

        await user.upload(within(dialog).getByLabelText('预设文件'), eggFile());
        await user.click(within(dialog).getByRole('button', { name: '更新预设' }));

        await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith('预设已更新', expect.anything()));
        expect(upload.mock.calls[0]![0].url).toBe('/api/admin/eggs/42/import');
        expect(upload.mock.calls[0]![0].data).toBeInstanceOf(FormData);
        expect(mocks.navigate).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
