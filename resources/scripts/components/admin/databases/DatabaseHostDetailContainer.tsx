import { useMemo } from 'react';
import { useStore } from '@tanstack/react-form';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Database, Trash2 } from 'lucide-react';
import { useAppForm, Form } from '@/components/form';
import { httpErrorToHuman } from '@/api/http';
import {
    type AdminDatabaseHost,
    deleteAdminDatabaseHostInput,
    updateAdminDatabaseHostInput,
    useAdminDatabaseHost,
    useAdminDatabaseHostDatabases,
    useDeleteAdminDatabaseHost,
    useUpdateAdminDatabaseHost,
} from '@/api/admin/database-hosts/queries';
import {
    databaseHostBodyFromFormValues,
    databaseHostFormValues,
    databaseHostValidators,
} from '@/components/admin/databases/databaseHostForm';
import DatabaseHostNodeSelect from '@/components/admin/databases/DatabaseHostNodeSelect';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { useExtensionPayload } from '@/extensions/forms';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Icon from '@/components/elements/Icon';
import Button from '@/components/elements/Button';
import Spinner from '@/components/elements/Spinner';
import DataTable from '@/components/elements/table/DataTable';
import DataTablePagination from '@/components/elements/table/DataTablePagination';
import { Dialog } from '@/components/elements/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ServerError } from '@/components/elements/ScreenBlock';
import { getPageSearch, usePageSearch } from '@/router/search';
import { databaseHostDetailRoute } from '@/router/routeTree';
import { relationshipAttributes } from '@/api/relationships';

function DatabaseHostDetailForm({ host }: { host: AdminDatabaseHost }) {
    const navigate = useNavigate();
    const updateDatabaseHost = useUpdateAdminDatabaseHost();
    const deleteDatabaseHost = useDeleteAdminDatabaseHost();

    const { withExtensionPayload } = useExtensionPayload('admin.database_host');
    const form = useAppForm({
        defaultValues: databaseHostFormValues(host),
        onSubmit: async ({ value }) => {
            try {
                const updated = await updateDatabaseHost.mutateAsync(
                    updateAdminDatabaseHostInput(
                        host.attributes.id,
                        databaseHostBodyFromFormValues(withExtensionPayload(value, host))
                    )
                );

                form.reset(databaseHostFormValues(updated));
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const nodeId = useStore(form.store, (state) => state.values.nodeId);

    const onDelete = (close: () => void) => {
        deleteDatabaseHost
            .mutateAsync(deleteAdminDatabaseHostInput(host.attributes.id, host.attributes.name))
            .then(() => navigate({ to: '/panel/databases' }))
            .catch(close);
    };

    return (
        <Form form={form} className='m-0'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <TitledGreyBox title='主机详情'>
                    <form.AppField name='name' validators={databaseHostValidators.name}>
                        {(field) => <field.TextField type='text' id='name' label='名称' />}
                    </form.AppField>
                    <div className='mt-6'>
                        <form.AppField name='host' validators={databaseHostValidators.host}>
                            {(field) => (
                                <field.TextField
                                    type='text'
                                    id='host'
                                    label='主机'
                                    description='面板连接此 MySQL 主机时使用的 IP 地址或 FQDN。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='port' validators={databaseHostValidators.port}>
                            {(field) => <field.NumberField id='port' label='端口' />}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <DatabaseHostNodeSelect
                            id='nodeId'
                            value={nodeId}
                            onChange={(value) => form.setFieldValue('nodeId', value)}
                        />
                    </div>
                    <div className='mt-6 text-sm text-muted-foreground'>
                        <p>{host.attributes.databases_count} databases</p>
                        <p>
                            {(() => {
                                const node = relationshipAttributes(host.attributes.relationships?.node);

                                return node === undefined ? '全局主机' : `关联到 ${node.name}`;
                            })()}
                        </p>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title='用户详情'>
                    <form.AppField name='username' validators={databaseHostValidators.username}>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='username'
                                label='用户名'
                                description='具有创建用户和数据库权限的数据库服务器用户。'
                            />
                        )}
                    </form.AppField>
                    <div className='mt-6'>
                        <form.AppField name='password'>
                            {(field) => (
                                <field.TextField
                                    type='password'
                                    id='password'
                                    label='密码'
                                    description='留空则保持现有密码。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <p className='text-sm text-destructive mt-6'>
                        所配置的账户必须具有 WITH GRANT OPTION 权限，且不应复用面板的数据库凭据。
                    </p>
                    <div className='flex justify-end mt-6'>
                        <Dialog.ConfirmTrigger
                            title='删除数据库主机'
                            confirm='删除主机'
                            pending={deleteDatabaseHost.isPending}
                            trigger={({ onClick }) => (
                                <Button type='button' color='red' isSecondary className='mr-2' onClick={onClick}>
                                    <Icon icon={Trash2} />
                                    删除主机
                                </Button>
                            )}
                            onConfirmed={(_event, close) => onDelete(close)}
                        >
                            删除 <strong>{host.attributes.name}</strong>{' '}
                            是不可撤销的操作。存在关联数据库的主机无法删除。
                        </Dialog.ConfirmTrigger>
                        <form.AppForm>
                            <form.SubmitButton>保存更改</form.SubmitButton>
                        </form.AppForm>
                    </div>
                </TitledGreyBox>
            </div>
            <form.AppField name='extensions'>
                {() => (
                    <ExtensionFormFields
                        form='admin.database_host'
                        mode='edit'
                        resource={host}
                        error={updateDatabaseHost.error}
                        boxed
                        submitLabel='保存更改'
                        className='mt-4'
                    />
                )}
            </form.AppField>
        </Form>
    );
}

function DatabaseHostDatabases({ hostId }: { hostId: number }) {
    const navigate = useNavigate();
    const page = usePageSearch();

    const { data: databases, isFetching } = useAdminDatabaseHostDatabases(hostId, page);
    const pagination = {
        pageIndex: Math.max(page - 1, 0),
        pageSize: databases?.meta.pagination.per_page ?? 50,
    };
    const data = useMemo(() => databases?.data ?? [], [databases?.data]);
    const columns = useMemo(
        () =>
            [
                {
                    id: 'server',
                    header: '服务器',
                    cell: ({ row }) => (
                        <Link
                            to='/panel/servers/$id/database'
                            params={{ id: row.original.attributes.server.id }}
                            className='block truncate text-sm text-foreground hover:text-accent'
                        >
                            {row.original.attributes.server.name}
                        </Link>
                    ),
                },
                {
                    id: 'database',
                    header: '数据库',
                    cell: ({ row }) => (
                        <span className='block truncate font-mono text-xs'>{row.original.attributes.name}</span>
                    ),
                    meta: { headerClassName: 'hidden sm:table-cell', cellClassName: 'hidden sm:table-cell' },
                },
                {
                    id: 'username',
                    header: '用户名',
                    cell: ({ row }) => <span className='text-xs'>{row.original.attributes.username}</span>,
                    meta: { headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell' },
                },
                {
                    id: 'connections',
                    header: '最大连接数',
                    cell: ({ row }) => (
                        <span className='text-xs text-muted-foreground'>
                            {row.original.attributes.max_connections ?? '无限制'}
                        </span>
                    ),
                    meta: { headerClassName: 'w-28 text-right', cellClassName: 'w-28 text-right' },
                },
            ] satisfies ColumnDef<NonNullable<typeof databases>['data'][number]>[],
        []
    );
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (database) => `${database.attributes.server.id}:${database.attributes.name}`,
        manualPagination: true,
        rowCount: databases?.meta.pagination.total ?? 0,
        state: { pagination },
        onPaginationChange: (updater) => {
            const next = updater instanceof Function ? updater(pagination) : updater;

            if (next.pageIndex !== pagination.pageIndex) {
                void navigate({
                    to: '/panel/databases/$id',
                    params: { id: hostId },
                    search: getPageSearch(next.pageIndex + 1),
                    replace: true,
                    viewTransition: false,
                });
            }
        },
    });

    return (
        <TitledGreyBox title='数据库' className='mt-4'>
            {databases ? (
                <>
                    <DataTable
                        table={table}
                        isFetching={isFetching}
                        emptyState={
                            <Empty size='compact'>
                                <EmptyHeader>
                                    <EmptyMedia variant='icon'>
                                        <Database />
                                    </EmptyMedia>
                                    <EmptyTitle>没有数据库</EmptyTitle>
                                    <EmptyDescription>在此主机上为服务器创建的数据库将显示在这里。</EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        }
                    />
                    <DataTablePagination
                        table={table}
                        total={databases.meta.pagination.total}
                        count={databases.meta.pagination.count}
                        itemLabel='数据库'
                    />
                </>
            ) : (
                <Spinner size='small' centered />
            )}
        </TitledGreyBox>
    );
}

export default function DatabaseHostDetailContainer() {
    const loadedHost = databaseHostDetailRoute.useLoaderData();
    const hostId = loadedHost.attributes.id;

    const { data: host = loadedHost, error } = useAdminDatabaseHost(hostId);

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} />;
    }

    if (!host) {
        return (
            <AdminContentBlock title='管理 · 数据库主机' heading='数据库主机'>
                <Spinner size='large' centered />
            </AdminContentBlock>
        );
    }

    return (
        <AdminContentBlock
            title={`管理 · 数据库主机 · ${host.attributes.name}`}
            heading={host.attributes.name}
            description={`${host.attributes.username}@${host.attributes.host}:${host.attributes.port}`}
        >
            <Link
                to='/panel/databases'
                className='inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-4'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回数据库主机
            </Link>

            <DatabaseHostDetailForm key={`${host.attributes.id}:${host.attributes.updated_at}`} host={host} />
            <DatabaseHostDatabases hostId={host.attributes.id} />
        </AdminContentBlock>
    );
}
