import { useMemo, useState } from 'react';
import { KeyRound } from 'lucide-react';
import {
    Code,
    ContentBox,
    DeleteAction,
    Dialog,
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    formatDate,
    RowActions,
    Spinner,
    SpinnerOverlay,
    Table,
    type ApiKeyItem,
    type TableColumn,
} from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

const apiKeyColumns = (onDelete: (identifier: string) => void): TableColumn<ApiKeyItem>[] => [
    {
        id: 'description',
        label: '描述',
        sortValue: (key) => key.description,
        cell: (key) => (
            <div className='min-w-40'>
                <p className='truncate font-medium'>{key.description}</p>
                <p className='mt-0.5 truncate font-mono text-xs text-muted-foreground md:hidden'>{key.identifier}</p>
            </div>
        ),
    },
    {
        id: 'identifier',
        label: '标识符',
        sortValue: (key) => key.identifier,
        cell: (key) => <code className='font-mono text-xs text-muted-foreground'>{key.identifier}</code>,
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
    },
    {
        id: 'last_used_at',
        label: '上次使用',
        sortValue: (key) => key.lastUsedAt,
        cell: (key) => (
            <span className='whitespace-nowrap text-xs text-muted-foreground'>
                {key.lastUsedAt ? formatDate(key.lastUsedAt, 'YYYY-MM-DD HH:mm') : '从未使用'}
            </span>
        ),
        headerClassName: 'hidden lg:table-cell w-40',
        cellClassName: 'hidden lg:table-cell w-40',
    },
    {
        id: 'actions',
        label: <span className='sr-only'>操作</span>,
        cell: (key) => (
            <RowActions>
                <DeleteAction
                    aria-label={`删除 API 密钥 ${key.description}`}
                    onClick={() => onDelete(key.identifier)}
                />
            </RowActions>
        ),
        headerClassName: 'w-14 text-right',
        cellClassName: 'w-14 text-right',
    },
];

export default function ApiKeyList({ model, className }: ViewProps<'account.apiKeys.list'>) {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const columns = useMemo(() => apiKeyColumns(setDeleteIdentifier), []);

    return (
        <ContentBox title='API 密钥' className={className}>
            <SpinnerOverlay visible={model.deleting} />
            <Dialog.Confirm
                title='删除 API 密钥'
                confirm='删除密钥'
                open={!!deleteIdentifier}
                pending={model.deleting}
                onClose={() => setDeleteIdentifier('')}
                onConfirmed={() => void model.remove(deleteIdentifier).then(() => setDeleteIdentifier(''))}
            >
                所有使用以下内容的请求： <Code>{deleteIdentifier}</Code> 密钥将失效。
            </Dialog.Confirm>
            {model.loading ? (
                <Spinner size='large' centered />
            ) : (
                <Table
                    rows={model.keys}
                    columns={columns}
                    keyOf={(key) => key.identifier}
                    emptyState={
                        <Empty size='compact'>
                            <EmptyHeader>
                                <EmptyMedia variant='icon'>
                                    <KeyRound />
                                </EmptyMedia>
                                <EmptyTitle>没有 API 密钥</EmptyTitle>
                                <EmptyDescription>
                                    创建密钥，以便在您自己的脚本和工具中使用客户端 API。
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    }
                />
            )}
        </ContentBox>
    );
}
