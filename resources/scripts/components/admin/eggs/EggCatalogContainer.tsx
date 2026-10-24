import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, Download, Egg, RefreshCw, SearchX, X } from 'lucide-react';
import {
    type EggCatalogEntry,
    importAdminCatalogEggInput,
    useAdminEggCatalog,
    useImportAdminCatalogEgg,
    useRefreshAdminEggCatalog,
} from '@/api/admin/eggs/catalog';
import { httpErrorToHuman } from '@/api/http';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import Button from '@/components/elements/Button';
import Icon from '@/components/elements/Icon';
import { NewButton } from '@/components/elements/NewButton';
import Label from '@/components/elements/Label';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import { Dialog } from '@/components/elements/dialog';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { TextInput } from '@/components/form/controls';
import Select from '@/components/ui/Select';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

const perPage = 24;

export default function EggCatalogContainer() {
    const navigate = useNavigate();
    const { data, error, isPending, isFetching, refetch } = useAdminEggCatalog();
    const refreshCatalog = useRefreshAdminEggCatalog();
    const importEgg = useImportAdminCatalogEgg();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<EggCatalogEntry | null>(null);

    const entries = data?.data ?? [];
    const categories = [...new Set(entries.map((entry) => entry.category).filter(Boolean))].sort();
    const needle = search.trim().toLocaleLowerCase();
    const matches = entries
        .filter((entry) => !category || entry.category === category)
        .filter((entry) => `${entry.name} ${entry.description}`.toLocaleLowerCase().includes(needle))
        .sort((left, right) => left.name.localeCompare(right.name));
    const totalPages = Math.max(1, Math.ceil(matches.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const visibleEntries = matches.slice((currentPage - 1) * perPage, currentPage * perPage);

    const submit = async () => {
        if (!selected || importEgg.isPending) {
            return;
        }

        try {
            const egg = await importEgg.mutateAsync(importAdminCatalogEggInput(selected.id));

            setSelected(null);
            void navigate({ to: '/panel/eggs/$eggId', params: { eggId: egg.attributes.id } });
        } catch {
            // Error toast is handled by the mutation.
        }
    };

    const renderResults = () => {
        if (isPending) {
            return <Spinner size='large' centered />;
        }

        if (matches.length === 0) {
            if (error) {
                return null;
            }

            if (search || category) {
                return (
                    <Empty className='border'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <SearchX />
                            </EmptyMedia>
                            <EmptyTitle>没有匹配的预设</EmptyTitle>
                            <EmptyDescription>没有预设匹配您的搜索。</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <NewButton
                                isSecondary
                                icon={X}
                                onClick={() => {
                                    setSearch('');
                                    setCategory('');
                                    setPage(1);
                                }}
                            >
                                清除搜索
                            </NewButton>
                        </EmptyContent>
                    </Empty>
                );
            }

            return (
                <Empty className='border'>
                    <EmptyHeader>
                        <EmptyMedia variant='icon'>
                            <Egg />
                        </EmptyMedia>
                        <EmptyTitle>预设目录为空</EmptyTitle>
                        <EmptyDescription>刷新目录以从 eggs.pterodactyl.io 下载最新的预设。</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <NewButton
                            isSecondary
                            icon={RefreshCw}
                            disabled={isFetching || refreshCatalog.isPending}
                            isLoading={refreshCatalog.isPending}
                            onClick={() => refreshCatalog.mutate({})}
                        >
                            刷新目录
                        </NewButton>
                    </EmptyContent>
                </Empty>
            );
        }

        return (
            <>
                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3' aria-busy={isFetching}>
                    {visibleEntries.map((entry) => (
                        <article
                            key={entry.id}
                            className='flex min-w-0 flex-col gap-3 rounded-sm border border-border bg-card p-4'
                        >
                            <div>
                                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                                    {entry.category}
                                </p>
                                <h2 className='mt-1 break-words text-base font-semibold text-foreground'>
                                    {entry.name}
                                </h2>
                            </div>
                            <p className='line-clamp-3 text-sm leading-relaxed text-muted-foreground'>
                                {entry.description || '未提供描述。'}
                            </p>
                            <div className='mt-auto flex flex-wrap items-center justify-between gap-3 pt-2'>
                                <a
                                    href={entry.source_url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
                                >
                                    查看源 <Icon icon={ArrowUpRight} />
                                </a>
                                <Button size='small' onClick={() => setSelected(entry)}>
                                    <Icon icon={Download} />
                                    导入
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
                <PaginationFooter
                    className='mt-6 flex-wrap gap-3'
                    pagination={{
                        total: matches.length,
                        count: visibleEntries.length,
                        perPage,
                        currentPage,
                        totalPages,
                    }}
                    onPageSelect={setPage}
                />
            </>
        );
    };

    return (
        <AdminContentBlock
            title='管理 · 预设目录'
            heading='预设目录'
            description='从 eggs.pterodactyl.io 查找并导入服务器模板。'
        >
            <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                <Link
                    to='/panel/eggs'
                    className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
                >
                    <Icon icon={ArrowLeft} className='mr-2' />
                    返回预设
                </Link>
                <Button
                    isSecondary
                    disabled={isFetching || refreshCatalog.isPending}
                    isLoading={refreshCatalog.isPending}
                    onClick={() => refreshCatalog.mutate({})}
                >
                    <Icon icon={RefreshCw} />
                    刷新目录
                </Button>
            </div>

            {error && (
                <Alert type='danger' className='mb-6'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                        <span>{httpErrorToHuman(error)}</span>
                        <Button isSecondary size='xsmall' disabled={isFetching} onClick={() => void refetch()}>
                            重试
                        </Button>
                    </div>
                </Alert>
            )}

            <div className='mb-6 grid gap-4 sm:grid-cols-3'>
                <div className='sm:col-span-2'>
                    <Label htmlFor='catalog-search'>搜索预设</Label>
                    <TextInput
                        id='catalog-search'
                        type='search'
                        placeholder='按名称或描述搜索…'
                        value={search}
                        onChange={(event) => {
                            setSearch(event.currentTarget.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div>
                    <Label htmlFor='catalog-category'>分类</Label>
                    <Select
                        id='catalog-category'
                        value={category}
                        options={[
                            { value: '', label: '所有分类' },
                            ...categories.map((value) => ({ value, label: value })),
                        ]}
                        onChange={(value) => {
                            setCategory(String(value));
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {renderResults()}

            <Dialog
                open={selected !== null}
                title={selected ? `Import ${selected.name}` : '导入预设'}
                description='将此预设的配置、变量与安装脚本添加到面板。'
                preventExternalClose={importEgg.isPending}
                hideCloseIcon={importEgg.isPending}
                onClose={() => setSelected(null)}
            >
                <div className='flex justify-end gap-3'>
                    <Button isSecondary disabled={importEgg.isPending} onClick={() => setSelected(null)}>
                        取消
                    </Button>
                    <Button
                        disabled={importEgg.isPending}
                        isLoading={importEgg.isPending}
                        onClick={() => void submit()}
                    >
                        导入预设
                    </Button>
                </div>
            </Dialog>
        </AdminContentBlock>
    );
}
