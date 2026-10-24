/** @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaginationFooter from './PaginationFooter';

afterEach(cleanup);

const summary = (container: HTMLElement) => container.querySelector('p')?.textContent?.replaceAll(/\s+/g, ' ');

describe('PaginationFooter', () => {
    it('reports a 1-based range for the current page', () => {
        const { container } = render(
            <PaginationFooter
                pagination={{ total: 60, count: 25, perPage: 25, currentPage: 2, totalPages: 3 }}
                onPageSelect={vi.fn()}
            />
        );

        expect(summary(container)).toBe('显示 26 至 50，共 60 条。');
    });

    it('reports the first and partial last pages', () => {
        const first = render(
            <PaginationFooter
                pagination={{ total: 60, count: 25, per_page: 25, current_page: 1, total_pages: 3 }}
                onPageSelect={vi.fn()}
            />
        );

        expect(summary(first.container)).toBe('显示 1 至 25，共 60 条。');
        first.unmount();

        const last = render(
            <PaginationFooter
                pagination={{ total: 60, count: 10, perPage: 25, currentPage: 3, totalPages: 3 }}
                onPageSelect={vi.fn()}
            />
        );

        expect(summary(last.container)).toBe('显示 51 至 60，共 60 条。');
    });

    it('reports an empty range for a page past the end', () => {
        const { container } = render(
            <PaginationFooter
                pagination={{ total: 60, count: 0, perPage: 25, currentPage: 4, totalPages: 3 }}
                onPageSelect={vi.fn()}
            />
        );

        expect(summary(container)).toBe('显示 0 至 0，共 60 条。');
    });

    it('only shows the summary when there is a single page', () => {
        const { container, queryAllByRole } = render(
            <PaginationFooter
                pagination={{ total: 4, count: 4, perPage: 25, currentPage: 1, totalPages: 1 }}
                onPageSelect={vi.fn()}
            />
        );

        expect(summary(container)).toBe('显示 1 至 4，共 4 条。');
        expect(queryAllByRole('button')).toHaveLength(0);
    });

    it('keeps the pager on a page past a single page of results', () => {
        const onPageSelect = vi.fn();
        const { getByRole } = render(
            <PaginationFooter
                pagination={{ total: 4, count: 0, perPage: 25, currentPage: 2, totalPages: 1 }}
                onPageSelect={onPageSelect}
            />
        );

        getByRole('button', { name: '1' }).click();

        expect(onPageSelect).toHaveBeenCalledWith(1);
    });
});
