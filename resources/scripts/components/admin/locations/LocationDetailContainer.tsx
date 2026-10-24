import { Link, useNavigate } from '@tanstack/react-router';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, HardDrive, Trash2 } from 'lucide-react';
import { useAppForm, Form } from '@/components/form';
import { httpErrorToHuman } from '@/api/http';
import type { AdminLocation } from '@/api/admin/locations/queries';
import {
    deleteAdminLocationInput,
    type LocationValues,
    updateAdminLocationInput,
    useAdminLocation,
    useDeleteAdminLocation,
    useUpdateAdminLocation,
} from '@/api/admin/locations/queries';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { initialExtensionValues, useExtensionPayload } from '@/extensions/forms';
import { validateShortCode } from '@/components/admin/locations/locationForm';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Icon from '@/components/elements/Icon';
import Button from '@/components/elements/Button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import { ServerError } from '@/components/elements/ScreenBlock';
import { locationDetailRoute } from '@/router/routeTree';
import DataTable from '@/components/elements/table/DataTable';
import { actionsColumn, EditLinkAction, RowActions } from '@/components/elements/table/RowActions';
import { relationshipData } from '@/api/relationships';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cardTitleClass } from '@/components/ui/typography';

const locationToValues = (location: AdminLocation): LocationValues => ({
    short: location.attributes.short,
    long: location.attributes.long ?? '',
    extensions: initialExtensionValues(),
});

type LocationNode = Extract<
    NonNullable<NonNullable<AdminLocation['attributes']['relationships']>['nodes']>,
    { data: unknown[] }
>['data'][number];

const locationNodeColumns = [
    {
        id: 'name',
        header: '节点',
        cell: ({ row }) => (
            <div className='min-w-0'>
                <Link
                    to='/panel/nodes/$id'
                    params={{ id: row.original.attributes.id }}
                    className='block truncate text-sm text-foreground hover:text-accent'
                >
                    {row.original.attributes.name}
                </Link>
                <p className='mt-1 truncate text-xs text-muted-foreground'>
                    ID {row.original.attributes.id} · {row.original.attributes.fqdn}
                </p>
            </div>
        ),
    },
    {
        id: 'servers',
        header: '服务器',
        cell: ({ row }) => (
            <span className='text-xs text-muted-foreground'>{row.original.attributes.servers_count}</span>
        ),
        meta: { headerClassName: 'w-20 text-right', cellClassName: 'w-20 text-right' },
    },
    actionsColumn<LocationNode>(1, (node) => (
        <RowActions>
            <EditLinkAction
                aria-label={`编辑 ${node.attributes.name}`}
                to='/panel/nodes/$id/settings'
                params={{ id: node.attributes.id }}
            />
        </RowActions>
    )),
] satisfies ColumnDef<LocationNode>[];

function LocationDetailForm({ location }: { location: AdminLocation }) {
    const { attributes } = location;
    const nodes = relationshipData(attributes.relationships?.nodes);
    const nodeTable = useReactTable({
        data: nodes,
        columns: locationNodeColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (node) => String(node.attributes.id),
    });
    const navigate = useNavigate();
    const updateLocation = useUpdateAdminLocation();
    const deleteLocation = useDeleteAdminLocation();

    const { withExtensionPayload } = useExtensionPayload('admin.location');
    const form = useAppForm({
        defaultValues: locationToValues(location),
        onSubmit: async ({ value }) => {
            try {
                const updated = await updateLocation.mutateAsync(
                    updateAdminLocationInput(attributes.id, withExtensionPayload(value, location))
                );

                form.reset(locationToValues(updated));
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const onDelete = (close: () => void) => {
        deleteLocation
            .mutateAsync(deleteAdminLocationInput(attributes.id, attributes.short))
            .then(() => {
                void navigate({ to: '/panel/locations' });
            })
            .catch(close);
    };

    return (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <TitledGreyBox title='地域详情'>
                <Form form={form} className='m-0'>
                    <form.AppField
                        name='short'
                        validators={{
                            onChange: ({ value }) => validateShortCode(value),
                        }}
                    >
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='short'
                                label='短代码'
                                description='用于区分此地域与其他地域的简短标识。'
                            />
                        )}
                    </form.AppField>
                    <div className='mt-6'>
                        <form.AppField
                            name='long'
                            validators={{
                                onChange: ({ value }) =>
                                    (value?.length ?? 0) <= 191 ? undefined : '描述不得超过 191 个字符。',
                            }}
                        >
                            {(field) => (
                                <field.TextField type='text' id='long' label='描述' description='此地域的详细描述。' />
                            )}
                        </form.AppField>
                    </div>
                    <form.AppField name='extensions'>
                        {() => (
                            <ExtensionFormFields
                                form='admin.location'
                                mode='edit'
                                resource={location}
                                error={updateLocation.error}
                                className='mt-6'
                            />
                        )}
                    </form.AppField>
                    <div className='flex justify-end mt-6'>
                        <Dialog.ConfirmTrigger
                            title='删除地域'
                            confirm='删除地域'
                            pending={deleteLocation.isPending}
                            onConfirmed={(_event, close) => onDelete(close)}
                            trigger={({ onClick }) => (
                                <Button type='button' color='red' isSecondary className='mr-2' onClick={onClick}>
                                    <Icon icon={Trash2} />
                                    删除地域
                                </Button>
                            )}
                        >
                            删除 <strong>{attributes.short}</strong> 是不可撤销的操作。已分配节点的地域无法删除。
                        </Dialog.ConfirmTrigger>
                        <form.AppForm>
                            <form.SubmitButton>保存更改</form.SubmitButton>
                        </form.AppForm>
                    </div>
                </Form>
            </TitledGreyBox>

            <TitledGreyBox
                title={
                    <div className='flex items-center justify-between gap-3'>
                        <h2 className={cardTitleClass}>节点</h2>
                        <span className='text-xs text-muted-foreground'>
                            {attributes.nodes_count} nodes · {attributes.servers_count} servers
                        </span>
                    </div>
                }
            >
                <DataTable
                    table={nodeTable}
                    emptyState={
                        <Empty size='compact'>
                            <EmptyHeader>
                                <EmptyMedia variant='icon'>
                                    <HardDrive />
                                </EmptyMedia>
                                <EmptyTitle>没有节点</EmptyTitle>
                                <EmptyDescription>分配到此地域的节点将显示在这里。</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    }
                />
            </TitledGreyBox>
        </div>
    );
}

export default function LocationDetailContainer() {
    const loadedLocation = locationDetailRoute.useLoaderData();
    const locationId = loadedLocation.attributes.id;

    const { data: location = loadedLocation, error } = useAdminLocation(locationId);

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} />;
    }

    if (!location) {
        return (
            <AdminContentBlock title='管理 · 地域' heading='Location'>
                <Spinner size='large' centered />
            </AdminContentBlock>
        );
    }

    return (
        <AdminContentBlock
            title={`管理 · 地域 · ${location.attributes.short}`}
            heading={location.attributes.short}
            description={location.attributes.long ?? '未提供描述。'}
        >
            <Link
                to='/panel/locations'
                className='inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-4'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回地域
            </Link>

            <LocationDetailForm
                key={`${location.attributes.id}:${location.attributes.updated_at}`}
                location={location}
            />
        </AdminContentBlock>
    );
}
