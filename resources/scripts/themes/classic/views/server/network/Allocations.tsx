import { useMemo } from 'react';
import { Network } from 'lucide-react';
import {
    actionsColumn,
    Badge,
    Button,
    Code,
    CopyOnClick,
    DeleteAction,
    Dialog,
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    InputSpinner,
    ListToolbar,
    NewButton,
    RowActions,
    Spinner,
    SpinnerOverlay,
    Table,
    TextArea,
    useDebouncedCallback,
    type TableColumn,
} from '@/sdk';
import type { ServerAllocationItem, ServerAllocationsModel, ViewProps } from '@/sdk/theme';
import { usePending } from '../usePending';

interface CellProps {
    model: ServerAllocationsModel;
    allocation: ServerAllocationItem;
}

function NotesCell({ model, allocation }: CellProps) {
    const [saving, track] = usePending();
    const save = useDebouncedCallback((notes: string) => track(model.actions.setNotes(allocation.id, notes)), 750);

    return (
        <InputSpinner visible={saving}>
            <TextArea
                aria-label={`${allocation.ip}:${allocation.port} 的备注`}
                className='min-h-9 resize-y bg-input hover:border-input-border border-transparent'
                placeholder='备注'
                defaultValue={allocation.notes || undefined}
                onChange={(event) => save(event.currentTarget.value)}
                onBlur={save.flush}
            />
        </InputSpinner>
    );
}

function DeleteAllocationButton({ model, allocation }: CellProps) {
    return (
        <Dialog.ConfirmTrigger
            title='移除分配'
            confirm='删除'
            onConfirmed={(_event, close) => model.actions.remove(allocation.id).then(close)}
            trigger={({ onClick }) => (
                <DeleteAction aria-label={`删除分配 ${allocation.address}:${allocation.port}`} onClick={onClick} />
            )}
        >
            此分配将立即从您的服务器移除。
        </Dialog.ConfirmTrigger>
    );
}

function ActionsCell({ model, allocation }: CellProps) {
    const [settingPrimary, track] = usePending();

    if (allocation.primary) {
        return (
            <Badge tone='info' className='inline-flex rounded-full font-medium'>
                首选
            </Badge>
        );
    }

    return (
        <RowActions>
            {model.permissions.update && (
                <Button.Text
                    size='xsmall'
                    disabled={settingPrimary}
                    onClick={() => track(model.actions.setPrimary(allocation.id))}
                >
                    设为首选
                </Button.Text>
            )}
            {model.permissions.delete && <DeleteAllocationButton model={model} allocation={allocation} />}
        </RowActions>
    );
}

function allocationColumns(model: ServerAllocationsModel): TableColumn<ServerAllocationItem>[] {
    return [
        {
            id: 'address',
            label: '地址',
            sortValue: (allocation) => allocation.address,
            cell: (allocation) => (
                <CopyOnClick text={allocation.address}>
                    <Code dark className='max-w-52 truncate'>
                        {allocation.address}
                    </Code>
                </CopyOnClick>
            ),
        },
        {
            id: 'port',
            label: '端口',
            sortValue: (allocation) => allocation.port,
            cell: (allocation) => <Code dark>{allocation.port}</Code>,
            headerClassName: 'w-24',
            cellClassName: 'w-24',
        },
        {
            id: 'notes',
            label: '备注',
            cell: (allocation) => <NotesCell model={model} allocation={allocation} />,
            headerClassName: 'hidden md:table-cell',
            cellClassName: 'hidden md:table-cell min-w-56',
        },
        actionsColumn(2, (allocation) => <ActionsCell model={model} allocation={allocation} />, 'w-52'),
    ];
}

export default function Allocations({ model, className }: ViewProps<'server.allocations'>) {
    const [creating, track] = usePending();
    const columns = useMemo(() => allocationColumns(model), [model]);

    if (model.loading) {
        return (
            <div className={className}>
                <Spinner size='large' centered />
            </div>
        );
    }

    const newAllocationButton = <NewButton onClick={() => track(model.actions.create())}>新建分配</NewButton>;

    return (
        <div className={className}>
            <SpinnerOverlay visible={creating} />
            {model.canManage && (
                <ListToolbar summary={`此服务器已使用 ${model.allocations.length} / ${model.limit} 个允许的分配。`}>
                    {model.canCreate && newAllocationButton}
                </ListToolbar>
            )}
            <Table
                rows={model.allocations}
                columns={columns}
                keyOf={(allocation) => String(allocation.id)}
                emptyState={
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <Network />
                            </EmptyMedia>
                            <EmptyTitle>没有分配</EmptyTitle>
                            <EmptyDescription>此服务器尚未分配任何网络分配。</EmptyDescription>
                        </EmptyHeader>
                        {model.canCreate && <EmptyContent>{newAllocationButton}</EmptyContent>}
                    </Empty>
                }
            />
        </div>
    );
}
