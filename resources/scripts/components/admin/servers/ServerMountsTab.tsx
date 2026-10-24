import { useCallback, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { FolderInput } from 'lucide-react';
import { httpErrorToHuman } from '@/api/http';
import {
    type AdminServer,
    type AdminServerMount,
    attachAdminServerMountInput,
    detachAdminServerMountInput,
    useAdminServerMounts,
    useAttachAdminServerMount,
    useDetachAdminServerMount,
} from '@/api/admin/servers/queries';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Code from '@/components/elements/Code';
import { NewLinkButton } from '@/components/elements/NewButton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import Button from '@/components/elements/Button';
import Spinner from '@/components/elements/Spinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import DataTable from '@/components/elements/table/DataTable';
import { actionsColumn, EditLinkAction, RowActions } from '@/components/elements/table/RowActions';

interface Props {
    server: AdminServer;
}

function ServerMountsContent({ server }: Props) {
    const { attributes } = server;
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const { mutate: attachMount } = useAttachAdminServerMount();
    const { mutate: detachMount } = useDetachAdminServerMount();

    const { data: mounts, error, isFetching, refetch } = useAdminServerMounts(attributes.id);

    const toggle = useCallback(
        (mount: AdminServerMount) => {
            const mountAttributes = mount.attributes;

            setUpdatingId(mountAttributes.id);

            if (mountAttributes.mounted) {
                detachMount(detachAdminServerMountInput(attributes.id, mountAttributes.id, mountAttributes.name), {
                    onSettled: () => setUpdatingId(null),
                });

                return;
            }

            attachMount(attachAdminServerMountInput(attributes.id, mountAttributes.id, mountAttributes.name), {
                onSettled: () => setUpdatingId(null),
            });
        },
        [attributes.id, attachMount, detachMount]
    );

    const data = useMemo(() => mounts?.data ?? [], [mounts?.data]);
    const columns = useMemo(
        () =>
            [
                {
                    id: 'name',
                    header: '挂载',
                    cell: ({ row }) => (
                        <div className='min-w-0'>
                            <Link
                                to='/panel/mounts/$id'
                                params={{ id: row.original.attributes.id }}
                                className='block truncate text-sm text-foreground hover:text-accent'
                            >
                                {row.original.attributes.name}
                            </Link>
                            <p className='mt-1 truncate text-xs text-muted-foreground'>
                                <Code>{row.original.attributes.source}</Code>
                                {' → '}
                                <Code>{row.original.attributes.target}</Code>
                            </p>
                        </div>
                    ),
                },
                {
                    id: 'status',
                    header: '状态',
                    cell: ({ row }) => (
                        <span
                            className={
                                row.original.attributes.mounted
                                    ? 'text-xs uppercase text-success'
                                    : 'text-xs uppercase text-muted-foreground'
                            }
                        >
                            {row.original.attributes.mounted ? 'Mounted' : 'Unmounted'}
                        </span>
                    ),
                    meta: { headerClassName: 'hidden sm:table-cell w-24', cellClassName: 'hidden sm:table-cell w-24' },
                },
                actionsColumn<AdminServerMount>(
                    2,
                    (mount) => (
                        <RowActions>
                            <EditLinkAction
                                aria-label={`编辑 ${mount.attributes.name}`}
                                to='/panel/mounts/$id'
                                params={{ id: mount.attributes.id }}
                            />
                            <Button
                                size='xsmall'
                                isSecondary
                                color={mount.attributes.mounted ? 'red' : 'primary'}
                                disabled={updatingId === mount.attributes.id}
                                isLoading={updatingId === mount.attributes.id}
                                onClick={() => toggle(mount)}
                            >
                                {mount.attributes.mounted ? 'Unmount' : 'Mount'}
                            </Button>
                        </RowActions>
                    ),
                    'w-36'
                ),
            ] satisfies ColumnDef<AdminServerMount>[],
        [toggle, updatingId]
    );
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (mount) => String(mount.attributes.id),
    });

    if (error && !mounts) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => refetch()} />;
    }

    return (
        <div>
            <TitledGreyBox title='可用挂载'>
                {mounts ? (
                    <DataTable
                        table={table}
                        isFetching={isFetching}
                        emptyState={
                            <Empty size='compact'>
                                <EmptyHeader>
                                    <EmptyMedia variant='icon'>
                                        <FolderInput />
                                    </EmptyMedia>
                                    <EmptyTitle>没有可用的挂载</EmptyTitle>
                                    <EmptyDescription>
                                        当挂载同时关联到此服务器的预设与其节点后，就会显示在这里。
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <NewLinkButton to='/panel/mounts' isSecondary icon={FolderInput}>
                                        管理挂载
                                    </NewLinkButton>
                                </EmptyContent>
                            </Empty>
                        }
                    />
                ) : (
                    <Spinner size='large' centered />
                )}
            </TitledGreyBox>
        </div>
    );
}

export default function ServerMountsTab() {
    const { server } = useServerDetail();

    if (server.attributes.container.installed !== 1) {
        return <ServerError message='由于当前安装状态，不允许访问此资源。' />;
    }

    return <ServerMountsContent server={server} />;
}
