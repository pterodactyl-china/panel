import { useExtensionTableColumns } from '@/extensions/tableColumns';
import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Egg, Search } from 'lucide-react';
import { httpErrorToHuman } from '@/api/http';
import { type AdminEggListItem, useAdminEggs } from '@/api/admin/eggs/queries';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import ImportEggButton from '@/components/admin/eggs/ImportEggButton';
import ListToolbar from '@/components/elements/ListToolbar';
import { NewLinkButton } from '@/components/elements/NewButton';
import { ServerError } from '@/components/elements/ScreenBlock';
import DataTable from '@/components/elements/table/DataTable';
import { actionsColumn, EditLinkAction, RowActions } from '@/components/elements/table/RowActions';
import { Alert } from '@/components/elements/alert';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

const eggColumns = [
    {
        id: 'name',
        header: '预设',
        cell: ({ row }) => (
            <div className='min-w-0'>
                <Link
                    to='/panel/eggs/$eggId'
                    params={{ eggId: row.original.attributes.id }}
                    className='block truncate font-medium text-foreground no-underline hover:text-accent'
                >
                    {row.original.attributes.name}
                </Link>
                {row.original.attributes.description ? (
                    <p className='mt-1 line-clamp-2 whitespace-normal break-words text-xs leading-relaxed text-muted-foreground md:line-clamp-none'>
                        {row.original.attributes.description}
                    </p>
                ) : null}
            </div>
        ),
        meta: { headerClassName: 'w-auto', cellClassName: 'w-auto' },
    },
    {
        id: 'author',
        header: '作者',
        cell: ({ row }) => (
            <span className='block max-w-64 truncate text-sm' title={row.original.attributes.author}>
                {row.original.attributes.author}
            </span>
        ),
        meta: { headerClassName: 'hidden w-64 md:table-cell', cellClassName: 'hidden w-64 md:table-cell' },
    },
    {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => <span className='tabular-nums text-sm'>{row.original.attributes.id}</span>,
        meta: { headerClassName: 'w-20 text-right', cellClassName: 'w-20 text-right' },
    },
    actionsColumn<AdminEggListItem>(1, (egg) => (
        <RowActions>
            <EditLinkAction
                aria-label={`编辑 ${egg.attributes.name}`}
                to='/panel/eggs/$eggId'
                params={{ eggId: egg.attributes.id }}
            />
        </RowActions>
    )),
] satisfies ColumnDef<AdminEggListItem>[];

export default function EggsContainer() {
    const { data: eggs, error, refetch } = useAdminEggs();
    const data = useMemo(() => eggs?.data ?? [], [eggs?.data]);
    const extensionColumns = useExtensionTableColumns('admin.eggs');
    const columns = useMemo(() => [...eggColumns, ...extensionColumns], [extensionColumns]);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (egg) => String(egg.attributes.id),
    });

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => refetch()} />;
    }

    return (
        <AdminContentBlock title='管理 · 预设' heading='预设' description='管理服务器模板、启动配置、变量与安装脚本。'>
            <Alert type='danger' className='mb-6 text-sm'>
                预设功能强大，编辑不当可能损坏服务器。除非您确信所做修改，否则请勿编辑官方预设。
            </Alert>
            <ListToolbar>
                <NewLinkButton to='/panel/eggs/catalog' isSecondary icon={Search}>
                    浏览预设目录
                </NewLinkButton>
                <ImportEggButton />
                <NewLinkButton to='/panel/eggs/new'>新建预设</NewLinkButton>
            </ListToolbar>
            <DataTable
                table={table}
                tableClassName='table-fixed'
                emptyState={
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <Egg />
                            </EmptyMedia>
                            <EmptyTitle>暂无预设</EmptyTitle>
                            <EmptyDescription>
                                预设是构建服务器所用的模板。可从预设目录浏览现成的预设，或自行创建。
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <NewLinkButton to='/panel/eggs/new'>新建预设</NewLinkButton>
                        </EmptyContent>
                    </Empty>
                }
            />
        </AdminContentBlock>
    );
}
