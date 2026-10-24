import { useMemo } from 'react';
import { KeySquare } from 'lucide-react';
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
    Table,
    type SshKeyItem,
    type SshKeyListModel,
    type TableColumn,
} from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

function DeleteKeyButton({ item, remove }: { item: SshKeyItem; remove: SshKeyListModel['remove'] }) {
    return (
        <Dialog.ConfirmTrigger
            title='删除 SSH 密钥'
            confirm='删除密钥'
            onConfirmed={(_event, close) => remove(item.fingerprint).then(close)}
            trigger={({ onClick }) => <DeleteAction aria-label={`删除 ${item.name}`} onClick={onClick} />}
        >
            移除 <Code>{item.name}</Code> 此 SSH 密钥后，它在整个面板中的使用将失效。
        </Dialog.ConfirmTrigger>
    );
}

const sshKeyColumns = (remove: SshKeyListModel['remove']): TableColumn<SshKeyItem>[] => [
    {
        id: 'name',
        label: '名称',
        sortValue: (key) => key.name,
        cell: (key) => (
            <div className='min-w-40'>
                <p className='truncate font-medium'>{key.name}</p>
                <p className='mt-0.5 truncate font-mono text-xs text-muted-foreground md:hidden'>
                    SHA256:{key.fingerprint}
                </p>
            </div>
        ),
    },
    {
        id: 'fingerprint',
        label: '指纹',
        sortValue: (key) => key.fingerprint,
        cell: (key) => <code className='font-mono text-xs text-muted-foreground'>SHA256:{key.fingerprint}</code>,
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
    },
    {
        id: 'created_at',
        label: '添加时间',
        sortValue: (key) => key.createdAt,
        cell: (key) => (
            <time dateTime={key.createdAt} className='whitespace-nowrap text-xs text-muted-foreground'>
                {formatDate(key.createdAt, 'YYYY-MM-DD HH:mm')}
            </time>
        ),
        headerClassName: 'hidden lg:table-cell w-40',
        cellClassName: 'hidden lg:table-cell w-40',
    },
    {
        id: 'actions',
        label: <span className='sr-only'>操作</span>,
        cell: (key) => (
            <RowActions>
                <DeleteKeyButton item={key} remove={remove} />
            </RowActions>
        ),
        headerClassName: 'w-14 text-right',
        cellClassName: 'w-14 text-right',
    },
];

export default function SshKeyList({ model, className }: ViewProps<'account.sshKeys.list'>) {
    const { remove } = model;
    const columns = useMemo(() => sshKeyColumns(remove), [remove]);

    return (
        <ContentBox title='SSH 密钥' className={className}>
            {model.loading ? (
                <Spinner size='large' centered />
            ) : (
                <Table
                    rows={model.keys}
                    columns={columns}
                    keyOf={(key) => key.fingerprint}
                    emptyState={
                        <Empty size='compact'>
                            <EmptyHeader>
                                <EmptyMedia variant='icon'>
                                    <KeySquare />
                                </EmptyMedia>
                                <EmptyTitle>没有 SSH 密钥</EmptyTitle>
                                <EmptyDescription>添加公钥以便无需密码登录 SFTP。</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    }
                />
            )}
        </ContentBox>
    );
}
