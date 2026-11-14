/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SecretInput from './SecretInput';

const clipboard = vi.hoisted(() => ({ copy: vi.fn<(text: string) => Promise<boolean>>() }));

vi.mock('@/lib/clipboard', () => ({ default: clipboard.copy }));

afterEach(() => {
    cleanup();
    document.getElementById('modal-portal')?.remove();
});
beforeEach(() => {
    const portal = document.createElement('div');

    portal.id = 'modal-portal';
    document.body.append(portal);
    clipboard.copy.mockReset();
    clipboard.copy.mockResolvedValue(true);
});

describe('SecretInput', () => {
    it('masks the value until revealed', () => {
        const { container } = render(<SecretInput value='hunter2' label='密码' />);
        const input = container.querySelector('input')!;

        expect(input).toHaveAttribute('type', 'password');

        fireEvent.click(screen.getByRole('button', { name: '显示密码' }));
        expect(input).toHaveAttribute('type', 'text');

        fireEvent.click(screen.getByRole('button', { name: '隐藏密码' }));
        expect(input).toHaveAttribute('type', 'password');
    });

    it('copies the value without revealing it', async () => {
        const { container } = render(<SecretInput value='hunter2' label='密码' />);

        await act(async () => fireEvent.click(screen.getByRole('button', { name: '复制密码' })));

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        expect(clipboard.copy).toHaveBeenCalledWith('hunter2');
        expect(container.querySelector('input')).toHaveAttribute('type', 'password');
        expect(screen.getByRole('status')).toHaveTextContent('文本已复制到剪贴板。');
    });

    it('disables both actions when there is no value', () => {
        render(<SecretInput value={undefined} label='密码' />);

        expect(screen.getByRole('button', { name: '显示密码' })).toBeDisabled();
        expect(screen.getByRole('button', { name: '复制密码' })).toBeDisabled();
    });
});
