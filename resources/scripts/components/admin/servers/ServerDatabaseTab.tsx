import { useMemo } from 'react';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Database, SlidersHorizontal } from 'lucide-react';
import { httpErrorToHuman } from '@/api/http';
import { type AdminServer, type AdminServerDatabase, useAdminServerDatabases } from '@/api/admin/servers/queries';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import { ServerDatabaseActions } from '@/components/admin/servers/ServerDatabaseRow';
import CreateServerDatabaseButton from '@/components/admin/servers/CreateServerDatabaseButton';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Spinner from '@/components/elements/Spinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import DataTable from '@/components/elements/table/DataTable';
import { actionsColumn } from '@/components/elements/table/RowActions';
import CopyOnClick from '@/components/elements/CopyOnClick';
import ListToolbar from '@/components/elements/ListToolbar';
import { NewLinkButton } from '@/components/elements/NewButton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

function ServerDatabaseContent({ server }: { server: AdminServer }) {
    const { attributes } = server;
    const { data: databases, error, isFetching, refetch } = useAdminServerDatabases(attributes.id);
    const data = useMemo(() => databases?.data ?? [], [databases?.data]);
    const columns = useMemo(
        () =>
            [
                {
                    id: 'name',
                    header: '数据库',
                    cell: ({ row }) => (
                        <CopyOnClick text={row.original.attributes.name}>
                            <span className='font-mono text-sm'>{row.original.attributes.name}</span>
                        </CopyOnClick>
                    ),
                },
                {
                    id: 'endpoint',
                    header: '端点',
                    cell: ({ row }) => (
                        <CopyOnClick
                            text={`${row.original.attributes.host.address}:${row.original.attributes.host.port}`}
                        >
                            <span className='text-xs'>
                                {row.original.attributes.host.address}:{row.original.attributes.host.port}
                            </span>
                        </CopyOnClick>
                    ),
                    meta: { headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell' },
                },
                {
                    id: 'username',
                    header: '用户名',
                    cell: ({ row }) => (
                        <CopyOnClick text={row.original.attributes.username}>
                            <span className='text-xs'>{row.original.attributes.username}</span>
                        </CopyOnClick>
                    ),
                    meta: { headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell' },
                },
                {
                    id: 'max',
                    header: '上限',
                    cell: ({ row }) => (
                        <span className='text-xs'>{row.original.attributes.max_connections ?? '无限制'}</span>
                    ),
                    meta: {
                        headerClassName: 'hidden xl:table-cell w-20 text-right',
                        cellClassName: 'hidden xl:table-cell w-20 text-right',
                    },
                },
                actionsColumn<AdminServerDatabase>(2, (database) => (
                    <ServerDatabaseActions serverId={attributes.id} database={database} />
                )),
            ] satisfies ColumnDef<AdminServerDatabase>[],
        [attributes.id]
    );
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (database) => database.attributes.id,
    });

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => refetch()} />;
    }

    const databaseLimit = attributes.feature_limits.databases ?? 0;
    const canCreate = databaseLimit > 0 && data.length < databaseLimit;
    const usage =
        databaseLimit > 0 && data.length > 0 ? `已为此服务器分配 ${data.length} / ${databaseLimit} 个数据库。` : null;

    return (
        <div>
            <TitledGreyBox title='数据库'>
                {databases ? (
                    <>
                        {(canCreate || usage) && (
                            <ListToolbar summary={usage}>
                                {canCreate && <CreateServerDatabaseButton serverId={attributes.id} />}
                            </ListToolbar>
                        )}
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
                                        <EmptyDescription>
                                            {databaseLimit > 0
                                                ? '此服务器还没有任何数据库。'
                                                : '此服务器的数据库上限为 0。请在构建设置中提高上限以创建数据库。'}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        {databaseLimit > 0 ? (
                                            <CreateServerDatabaseButton serverId={attributes.id} />
                                        ) : (
                                            <NewLinkButton
                                                to={`/panel/servers/${attributes.id}/build`}
                                                isSecondary
                                                icon={SlidersHorizontal}
                                            >
                                                构建设置
                                            </NewLinkButton>
                                        )}
                                    </EmptyContent>
                                </Empty>
                            }
                        />
                    </>
                ) : (
                    <Spinner size='large' centered />
                )}
            </TitledGreyBox>
        </div>
    );
}

export default function ServerDatabaseTab() {
    const { server } = useServerDetail();

    if (server.attributes.container.installed !== 1) {
        return <ServerError message='由于当前安装状态，不允许访问此资源。' />;
    }

    return <ServerDatabaseContent server={server} />;
}
