import { useStore } from '@tanstack/react-form';
import type { ColumnDef } from '@tanstack/react-table';
import { Link } from '@tanstack/react-router';
import { deleteAdminLocationInput, type AdminLocation, useDeleteAdminLocation } from '@/api/admin/locations/queries';
import Button from '@/components/elements/Button';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import DataTableColumnHeader from '@/components/elements/table/DataTableColumnHeader';
import { actionsColumn, DeleteAction, EditLinkAction, RowActions } from '@/components/elements/table/RowActions';
import { Form, useAppForm } from '@/components/form';
import dayjs from '@/lib/dayjs';

interface LocationDialogProps {
    location: AdminLocation;
    open: boolean;
    onClose: () => void;
}

function DeleteLocationDialog({ location, open, onClose }: LocationDialogProps) {
    const { attributes } = location;
    const deleteLocation = useDeleteAdminLocation();
    const form = useAppForm({
        defaultValues: { confirm: '' },
        onSubmit: async () => {
            try {
                await deleteLocation.mutateAsync(deleteAdminLocationInput(attributes.id, attributes.short));
                onClose();
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });
    const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

    return (
        <Dialog
            open={open}
            title='确认删除地域'
            preventExternalClose={isSubmitting}
            hideCloseIcon={isSubmitting}
            onClose={onClose}
        >
            <SpinnerOverlay visible={isSubmitting} />
            <p className='text-sm'>
                删除地域是不可撤销的操作。这将移除 <strong>{attributes.short}</strong>.
            </p>
            <Form form={form} className='m-0 mt-6'>
                <form.AppField
                    name='confirm'
                    validators={{
                        onChange: ({ value }) => (value === attributes.short ? undefined : '必须提供短代码。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id={`confirm_${attributes.id}`}
                            label='确认短代码'
                            description='输入短代码以确认删除。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6 flex justify-end gap-2'>
                    <Button.Text type='button' isSecondary onClick={onClose}>
                        取消
                    </Button.Text>
                    <form.AppForm>
                        <form.SubmitButton color='red'>删除地域</form.SubmitButton>
                    </form.AppForm>
                </div>
            </Form>
        </Dialog>
    );
}

const LocationActionsCell = ({ location }: { location: AdminLocation }) => (
    <RowActions>
        <EditLinkAction
            aria-label={`编辑 ${location.attributes.short}`}
            to='/panel/locations/$id'
            params={{ id: location.attributes.id }}
        />
        <Dialog.Trigger
            trigger={({ onClick }) => (
                <DeleteAction aria-label={`删除 ${location.attributes.short}`} onClick={onClick} />
            )}
        >
            {({ open, onClose }) => <DeleteLocationDialog location={location} open={open} onClose={onClose} />}
        </Dialog.Trigger>
    </RowActions>
);

export const locationColumns = [
    {
        id: 'short',
        accessorFn: (location) => location.attributes.short,
        header: ({ column }) => <DataTableColumnHeader column={column} title='地域' />,
        cell: ({ row }) => (
            <div className='w-0 min-w-full'>
                <Link
                    to='/panel/locations/$id'
                    params={{ id: row.original.attributes.id }}
                    title={row.original.attributes.short}
                    className='block truncate font-medium text-foreground no-underline hover:text-accent'
                >
                    {row.original.attributes.short}
                </Link>
                {row.original.attributes.long ? (
                    <p className='mt-0.5 truncate text-xs text-muted-foreground' title={row.original.attributes.long}>
                        {row.original.attributes.long}
                    </p>
                ) : null}
            </div>
        ),
        enableSorting: true,
        meta: { headerClassName: 'min-w-48', cellClassName: 'min-w-48' },
    },
    {
        id: 'nodes_count',
        header: '节点',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.attributes.nodes_count}</span>,
        enableSorting: false,
        meta: { headerClassName: 'hidden w-20 @sm:table-cell', cellClassName: 'hidden w-20 @sm:table-cell' },
    },
    {
        id: 'servers_count',
        header: '服务器',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.attributes.servers_count}</span>,
        enableSorting: false,
        meta: { headerClassName: 'hidden w-20 @lg:table-cell', cellClassName: 'hidden w-20 @lg:table-cell' },
    },
    {
        id: 'created_at',
        accessorFn: (location) => location.attributes.created_at,
        header: ({ column }) => <DataTableColumnHeader column={column} title='创建时间' />,
        cell: ({ row }) => (
            <time
                className='whitespace-nowrap text-xs text-muted-foreground'
                dateTime={row.original.attributes.created_at}
            >
                {dayjs(row.original.attributes.created_at).format('YYYY-MM-DD')}
            </time>
        ),
        enableSorting: true,
        sortDescFirst: true,
        meta: { headerClassName: 'hidden w-28 @xl:table-cell', cellClassName: 'hidden w-28 @xl:table-cell' },
    },
    actionsColumn<AdminLocation>(2, (location) => <LocationActionsCell location={location} />),
] satisfies ColumnDef<AdminLocation>[];
