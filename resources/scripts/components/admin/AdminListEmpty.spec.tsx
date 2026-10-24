/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Server } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminListEmpty from './AdminListEmpty';

afterEach(cleanup);

describe('AdminListEmpty', () => {
    it('offers the create action when nothing exists yet', () => {
        render(
            <AdminListEmpty
                icon={Server}
                noun='服务器'
                onClearFilter={vi.fn()}
                description='Create a server to get started.'
                action={<button type='button'>新建服务器</button>}
            />
        );

        expect(screen.getByText('暂无服务器')).toBeInTheDocument();
        expect(screen.getByText('Create a server to get started.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '新建服务器' })).toBeInTheDocument();
    });

    it('explains a search miss and clears the search instead of offering creation', async () => {
        const onClearFilter = vi.fn();

        render(
            <AdminListEmpty
                icon={Server}
                noun='服务器'
                filter='minecraft'
                onClearFilter={onClearFilter}
                description='Create a server to get started.'
                action={<button type='button'>新建服务器</button>}
            />
        );

        expect(screen.getByText('没有匹配的服务器')).toBeInTheDocument();
        expect(screen.getByText('minecraft')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '新建服务器' })).not.toBeInTheDocument();

        await userEvent.setup().click(screen.getByRole('button', { name: '清除搜索' }));

        expect(onClearFilter).toHaveBeenCalledOnce();
    });
});
