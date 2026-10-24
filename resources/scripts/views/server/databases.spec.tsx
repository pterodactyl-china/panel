// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AxiosAdapter } from 'axios';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import http from '@/api/http';
import { serverDatabasesQueryOptions, type ServerDatabase } from '@/api/server/databases/queries';
import { createExtensionTestHost, createTestServer, type ExtensionTestHost } from '@/sdk/testing';
import { View } from '../View';

vi.mock('@/plugins/notifications', () => ({ notifyHttpError: vi.fn() }));

const database = (id: string, name: string, password = 'secret'): ServerDatabase => ({
    object: 'server_database',
    attributes: {
        id,
        name: `s1_${name}`,
        username: `u1_${name}`,
        connections_from: '%',
        max_connections: 0,
        host: { address: '10.0.0.5', port: 3306 },
        relationships: { password: { object: 'database_password', attributes: { password } } },
    },
});
const originalAdapter = http.defaults.adapter;
let requests: { method: string; path: string; body: unknown }[];
let host: ExtensionTestHost | undefined;
let portal: HTMLElement;

beforeEach(() => {
    requests = [];
    portal = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'modal-portal' }));
    http.defaults.adapter = (async (config) => {
        const url = new URL(config.url!, 'https://panel.test');
        const body = config.data ? (JSON.parse(String(config.data)) as { database?: string }) : undefined;

        requests.push({ method: config.method!, path: url.pathname, body });
        const data = body?.database ? database('new', body.database) : database('survival', 'survival', 'rotated');

        return { config, headers: {}, status: 200, statusText: 'OK', data: config.method === 'delete' ? '' : data };
    }) satisfies AxiosAdapter;
});

afterEach(() => {
    cleanup();
    host?.dispose();
    host = undefined;
    portal.remove();
    http.defaults.adapter = originalAdapter;
});

async function renderDatabases(databases: ServerDatabase[], options: { limit?: number; permissions?: string[] } = {}) {
    const server = createTestServer(options.permissions ? { owner: false, permissions: options.permissions } : {});

    server.attributes.feature_limits.databases = options.limit ?? 2;
    host = createExtensionTestHost({ server });
    host.queryClient.setQueryData(serverDatabasesQueryOptions(server.attributes.uuid).queryKey, {
        object: 'list',
        data: databases,
    });
    render(<View name='page.server.databases' />, { wrapper: host.Wrapper });
    await screen.findByText(databases.length ? databases[0].attributes.name : '没有数据库');
}

it('lists the databases with their usage and creates another', async () => {
    await renderDatabases([database('survival', 'survival')]);

    expect(screen.getByText('1 of 2 databases have been allocated to this server.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '新建数据库' }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('数据库名称'), { target: { value: 'x' } });
    expect(await within(dialog).findByText('数据库名称至少为 3 个字符。')).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText('数据库名称'), { target: { value: 'stats' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '创建数据库' }));

    await waitFor(() =>
        expect(requests).toContainEqual(
            expect.objectContaining({ method: 'post', body: { database: 'stats', remote: '%' } })
        )
    );
    expect(await screen.findByText('s1_stats')).toBeVisible();
    expect(screen.queryByRole('button', { name: '新建数据库' })).not.toBeInTheDocument();
});

it('shows the connection details and rotates the password', async () => {
    await renderDatabases([database('survival', 'survival')]);

    fireEvent.click(screen.getByRole('button', { name: '查看 s1_survival 的连接详情' }));
    const dialog = await screen.findByRole('dialog');

    expect(
        within(dialog).getByDisplayValue('jdbc:mysql://10.0.0.5:3306/s1_survival?user=u1_survival&password=secret')
    ).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: '轮换密码' }));

    await waitFor(() => expect(within(dialog).getByDisplayValue(/password=rotated$/)).toBeVisible());
    expect(requests.some((request) => request.path.endsWith('/databases/survival/rotate-password'))).toBe(true);
});

it('deletes a database once its name is typed', async () => {
    await renderDatabases([database('survival', 'survival')]);

    fireEvent.click(screen.getByRole('button', { name: '删除 s1_survival' }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('确认数据库名称'), { target: { value: 'survival' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '删除数据库' }));

    await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({ method: 'delete' })));
    expect(await screen.findByText('没有数据库')).toBeVisible();
});

it('hides what the user may not do', async () => {
    await renderDatabases([database('survival', 'survival')], { permissions: ['database.read'] });

    expect(screen.queryByText(/databases have been allocated/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除 s1_survival' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看 s1_survival 的连接详情' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).queryByText('密码')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: '轮换密码' })).not.toBeInTheDocument();
});

it('explains a database limit of zero', async () => {
    await renderDatabases([], { limit: 0 });

    expect(screen.getByText('无法创建数据库，因为此服务器的数据库上限为 0。')).toBeVisible();
});
