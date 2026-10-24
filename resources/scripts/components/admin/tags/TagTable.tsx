import type { ColumnDef } from '@tanstack/react-table';
import { deleteAdminTagInput, type AdminTag, useDeleteAdminTag } from '@/api/admin/tags/queries';
import TagBadge from '@/components/admin/tags/TagBadge';
import TagFormDialog from '@/components/admin/tags/TagFormDialog';
import { Dialog } from '@/components/elements/dialog';
import DataTableColumnHeader from '@/components/elements/table/DataTableColumnHeader';
import { actionsColumn, DeleteAction, EditAction, RowActions } from '@/components/elements/table/RowActions';

const TagActionsCell = ({ tag }: { tag: AdminTag }) => {
    const deleteTag = useDeleteAdminTag();
    const { eggs_count: eggsCount, is_predefined: isPredefined, name, nodes_count: nodesCount } = tag.attributes;

    if (isPredefined) {
        return <span className='text-xs text-muted-foreground'>内置</span>;
    }

    return (
        <RowActions>
            <Dialog.Trigger trigger={({ onClick }) => <EditAction aria-label={`编辑 ${name}`} onClick={onClick} />}>
                {({ open, onClose }) => <TagFormDialog tag={tag} open={open} onClose={onClose} />}
            </Dialog.Trigger>
            <Dialog.ConfirmTrigger
                title='删除标签'
                confirm='删除标签'
                onConfirmed={async (_event, close) => {
                    try {
                        await deleteTag.mutateAsync(deleteAdminTagInput(tag.attributes.id, name));
                        close();
                    } catch {
                        // Error toast is handled by the mutation.
                    }
                }}
                trigger={({ onClick }) => <DeleteAction aria-label={`删除 ${name}`} onClick={onClick} />}
            >
                <p className='text-sm leading-relaxed text-muted-foreground'>
                    这将永久删除 <strong className='text-foreground'>{name}</strong>，并将其从 {eggsCount} 个预设和{' '}
                    {nodesCount} 个节点中移除。
                </p>
            </Dialog.ConfirmTrigger>
        </RowActions>
    );
};

export const tagColumns = [
    {
        id: 'name',
        accessorFn: (tag) => tag.attributes.name,
        header: ({ column }) => <DataTableColumnHeader column={column} title='标签' />,
        cell: ({ row }) => <TagBadge tag={row.original} />,
        enableSorting: true,
        meta: { headerClassName: 'w-auto', cellClassName: 'w-auto' },
    },
    {
        id: 'slug',
        accessorFn: (tag) => tag.attributes.slug,
        header: ({ column }) => <DataTableColumnHeader column={column} title='标识' />,
        cell: ({ row }) => (
            <span
                className='block w-0 min-w-full truncate font-mono text-xs text-muted-foreground'
                title={row.original.attributes.slug}
            >
                {row.original.attributes.slug}
            </span>
        ),
        enableSorting: true,
        meta: { headerClassName: 'hidden w-52 @lg:table-cell', cellClassName: 'hidden w-52 @lg:table-cell' },
    },
    {
        id: 'eggs_count',
        header: '预设',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.attributes.eggs_count}</span>,
        enableSorting: false,
        meta: { headerClassName: 'hidden w-20 @xl:table-cell', cellClassName: 'hidden w-20 @xl:table-cell' },
    },
    {
        id: 'nodes_count',
        header: '节点',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.attributes.nodes_count}</span>,
        enableSorting: false,
        meta: { headerClassName: 'hidden w-20 @2xl:table-cell', cellClassName: 'hidden w-20 @2xl:table-cell' },
    },
    actionsColumn<AdminTag>(2, (tag) => <TagActionsCell tag={tag} />),
] satisfies ColumnDef<AdminTag>[];
