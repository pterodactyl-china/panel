import { useMemo } from 'react';
import { useStore } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Egg, HardDrive } from 'lucide-react';
import type { AppForm } from '@/components/form';
import { useAppForm, Form } from '@/components/form';
import { httpErrorToHuman } from '@/api/http';
import {
    type AdminMountEgg,
    type AdminMountNode,
    type AdminMountWithRelations,
    deleteAdminMountInput,
    detachAdminMountEggInput,
    detachAdminMountNodeInput,
    type MountValues,
    updateAdminMountInput,
    useAdminMount,
    useDeleteAdminMount,
    useDetachAdminMountEgg,
    useDetachAdminMountNode,
    useUpdateAdminMount,
} from '@/api/admin/mounts/queries';
import { mountDetailRoute } from '@/router/routeTree';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { initialExtensionValues, useExtensionPayload } from '@/extensions/forms';
import AttachEggsModal from '@/components/admin/mounts/AttachEggsModal';
import AttachNodesModal from '@/components/admin/mounts/AttachNodesModal';
import { validateMountName } from '@/components/admin/mounts/mountForm';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Icon from '@/components/elements/Icon';
import Button from '@/components/elements/Button';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import { ServerError } from '@/components/elements/ScreenBlock';
import DataTable from '@/components/elements/table/DataTable';
import { actionsColumn, DeleteAction, EditLinkAction, RowActions } from '@/components/elements/table/RowActions';
import ListToolbar from '@/components/elements/ListToolbar';
import { NewButton } from '@/components/elements/NewButton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { relationshipData } from '@/api/relationships';

type MountForm = AppForm<MountValues>;

const mountToValues = (mount: AdminMountWithRelations): MountValues => ({
    name: mount.attributes.name,
    description: mount.attributes.description ?? '',
    source: mount.attributes.source,
    target: mount.attributes.target,
    readOnly: mount.attributes.read_only,
    userMountable: mount.attributes.user_mountable,
    extensions: initialExtensionValues(),
});

const MountDetailsCard = ({
    form,
    mount,
    error,
    onDelete,
}: {
    form: MountForm;
    mount: AdminMountWithRelations;
    error: unknown;
    onDelete: () => void;
}) => (
    <TitledGreyBox title='挂载详情'>
        <Form form={form} className='m-0'>
            <form.AppField
                name='name'
                validators={{
                    onChange: ({ value }) => validateMountName(value),
                }}
            >
                {(field) => (
                    <field.TextField type='text' id='name' label='名称' description='用于标识此挂载的唯一名称。' />
                )}
            </form.AppField>
            <div className='mt-6'>
                <form.AppField
                    name='description'
                    validators={{
                        onChange: ({ value }) => (value.length <= 191 ? undefined : '描述不得超过 191 个字符。'),
                    }}
                >
                    {(field) => (
                        <field.TextField type='text' id='description' label='描述' description='此挂载的详细描述。' />
                    )}
                </form.AppField>
            </div>
            <div className='mt-6'>
                <form.AppField
                    name='source'
                    validators={{
                        onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供源路径。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='source'
                            label='源路径'
                            description='宿主机上要挂载到容器中的路径。'
                        />
                    )}
                </form.AppField>
            </div>
            <div className='mt-6'>
                <form.AppField
                    name='target'
                    validators={{
                        onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供目标路径。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='target'
                            label='目标路径'
                            description='源路径在容器内挂载的目标路径。'
                        />
                    )}
                </form.AppField>
            </div>
            <div className='mt-6'>
                <form.AppField name='readOnly'>
                    {(field) => <field.SwitchField label='只读' description='在容器内以只读方式挂载此卷。' />}
                </form.AppField>
            </div>
            <div className='mt-6'>
                <form.AppField name='userMountable'>
                    {(field) => <field.SwitchField label='用户可挂载' description='允许用户将此挂载添加到服务器。' />}
                </form.AppField>
            </div>
            <form.AppField name='extensions'>
                {() => (
                    <ExtensionFormFields
                        form='admin.mount'
                        mode='edit'
                        resource={mount}
                        error={error}
                        className='mt-6'
                    />
                )}
            </form.AppField>
            <div className='flex justify-end mt-6'>
                <Button type='button' color='red' isSecondary className='mr-2' onClick={onDelete}>
                    删除挂载
                </Button>
                <form.AppForm>
                    <form.SubmitButton>保存更改</form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    </TitledGreyBox>
);

const AttachedEggsCard = ({
    eggs,
    onDetach,
    onAttach,
}: {
    eggs: AdminMountEgg[];
    onDetach: (egg: AdminMountEgg) => void;
    onAttach: () => void;
}) => {
    const columns = useMemo(
        () =>
            [
                {
                    id: 'name',
                    header: '预设',
                    cell: ({ row }) => (
                        <Link
                            to='/panel/eggs/$eggId'
                            params={{ eggId: row.original.attributes.id }}
                            className='block truncate text-sm text-foreground hover:text-accent'
                        >
                            {row.original.attributes.name}
                        </Link>
                    ),
                },
                {
                    id: 'id',
                    header: 'ID',
                    cell: ({ row }) => (
                        <span className='text-xs text-muted-foreground'>{row.original.attributes.id}</span>
                    ),
                    meta: {
                        headerClassName: 'hidden sm:table-cell w-16 text-right',
                        cellClassName: 'hidden sm:table-cell w-16 text-right',
                    },
                },
                actionsColumn<AdminMountEgg>(2, (egg) => (
                    <RowActions>
                        <EditLinkAction
                            aria-label={`编辑 ${egg.attributes.name}`}
                            to='/panel/eggs/$eggId'
                            params={{ eggId: egg.attributes.id }}
                        />
                        <Dialog.ConfirmTrigger
                            title='解除预设关联'
                            confirm='解除预设关联'
                            trigger={({ onClick }) => (
                                <DeleteAction
                                    label='解除关联'
                                    aria-label={`解除 ${egg.attributes.name}`}
                                    onClick={onClick}
                                />
                            )}
                            onConfirmed={(_event, close) => {
                                close();
                                onDetach(egg);
                            }}
                        >
                            这将从挂载中解除预设 <strong>{egg.attributes.name}</strong>
                            。使用该预设的服务器将不再获得此挂载。
                        </Dialog.ConfirmTrigger>
                    </RowActions>
                )),
            ] satisfies ColumnDef<AdminMountEgg>[],
        [onDetach]
    );
    const table = useReactTable({
        data: eggs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (egg) => String(egg.attributes.id),
    });

    return (
        <TitledGreyBox title='预设'>
            <ListToolbar>
                <NewButton onClick={onAttach}>关联预设</NewButton>
            </ListToolbar>
            <DataTable
                table={table}
                emptyState={
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <Egg />
                            </EmptyMedia>
                            <EmptyTitle>未关联预设</EmptyTitle>
                            <EmptyDescription>使用已关联预设的服务器将获得此挂载。</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <NewButton onClick={onAttach}>关联预设</NewButton>
                        </EmptyContent>
                    </Empty>
                }
            />
        </TitledGreyBox>
    );
};

const AttachedNodesCard = ({
    nodes,
    onDetach,
    onAttach,
}: {
    nodes: AdminMountNode[];
    onDetach: (node: AdminMountNode) => void;
    onAttach: () => void;
}) => {
    const columns = useMemo(
        () =>
            [
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
                                {row.original.attributes.fqdn}
                            </p>
                        </div>
                    ),
                },
                actionsColumn<AdminMountNode>(2, (node) => (
                    <RowActions>
                        <EditLinkAction
                            aria-label={`编辑 ${node.attributes.name}`}
                            to='/panel/nodes/$id/settings'
                            params={{ id: node.attributes.id }}
                        />
                        <Dialog.ConfirmTrigger
                            title='解除节点关联'
                            confirm='解除节点关联'
                            trigger={({ onClick }) => (
                                <DeleteAction
                                    label='解除关联'
                                    aria-label={`解除 ${node.attributes.name}`}
                                    onClick={onClick}
                                />
                            )}
                            onConfirmed={(_event, close) => {
                                close();
                                onDetach(node);
                            }}
                        >
                            这将从挂载中解除节点 <strong>{node.attributes.name}</strong>
                            。位于该节点上的服务器将不再获得此挂载。
                        </Dialog.ConfirmTrigger>
                    </RowActions>
                )),
            ] satisfies ColumnDef<AdminMountNode>[],
        [onDetach]
    );
    const table = useReactTable({
        data: nodes,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (node) => String(node.attributes.id),
    });

    return (
        <TitledGreyBox title='节点'>
            <ListToolbar>
                <NewButton onClick={onAttach}>关联节点</NewButton>
            </ListToolbar>
            <DataTable
                table={table}
                emptyState={
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <HardDrive />
                            </EmptyMedia>
                            <EmptyTitle>未关联节点</EmptyTitle>
                            <EmptyDescription>位于已关联节点上的服务器将获得此挂载。</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <NewButton onClick={onAttach}>关联节点</NewButton>
                        </EmptyContent>
                    </Empty>
                }
            />
        </TitledGreyBox>
    );
};

const DeleteMountDialog = ({
    mount,
    onClose,
    onDeleted,
}: {
    mount: AdminMountWithRelations;
    onClose: () => void;
    onDeleted: () => Promise<void>;
}) => {
    const deleteMount = useDeleteAdminMount();
    const deleteForm = useAppForm({
        defaultValues: { confirm: '' },
        onSubmit: async () => {
            try {
                await deleteMount.mutateAsync(deleteAdminMountInput(mount.attributes.id, mount.attributes.name));
                await onDeleted();
                onClose();
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });
    const deleteSubmitting = useStore(deleteForm.store, (state) => state.isSubmitting);

    const close = () => {
        deleteForm.reset();
        onClose();
    };

    return (
        <Dialog
            open
            title='确认删除挂载'
            preventExternalClose={deleteSubmitting}
            hideCloseIcon={deleteSubmitting}
            onClose={close}
        >
            <SpinnerOverlay visible={deleteSubmitting} />
            <p className='text-sm'>
                删除挂载是不可撤销的操作。这将永久删除挂载 <strong>{mount.attributes.name}</strong>{' '}
                ，并从所有预设和节点中解除关联。
            </p>
            <Form form={deleteForm} className='m-0 mt-6'>
                <deleteForm.AppField
                    name='confirm'
                    validators={{
                        onChange: ({ value }) => (value === mount.attributes.name ? undefined : '必须提供挂载名称。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='confirm_mount_name'
                            label='确认名称'
                            description='输入此挂载的名称以确认删除。'
                        />
                    )}
                </deleteForm.AppField>
                <div className='mt-6 text-right'>
                    <Button type='button' isSecondary className='mr-2' onClick={close}>
                        取消
                    </Button>
                    <deleteForm.AppForm>
                        <deleteForm.SubmitButton color='red'>删除挂载</deleteForm.SubmitButton>
                    </deleteForm.AppForm>
                </div>
            </Form>
        </Dialog>
    );
};

const MountDetailContent = ({ mount }: { mount: AdminMountWithRelations }) => {
    const navigate = useNavigate();
    const mountId = mount.attributes.id;

    const updateMount = useUpdateAdminMount();
    const detachMountEgg = useDetachAdminMountEgg();
    const detachMountNode = useDetachAdminMountNode();

    const { withExtensionPayload } = useExtensionPayload('admin.mount');
    const editForm = useAppForm({
        defaultValues: mountToValues(mount),
        onSubmit: async ({ value }) => {
            try {
                await updateMount.mutateAsync(updateAdminMountInput(mountId, withExtensionPayload(value, mount)));
                editForm.reset({ ...value, extensions: initialExtensionValues() });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const onDetachEgg = (egg: AdminMountEgg) => {
        detachMountEgg.mutate(detachAdminMountEggInput(mountId, egg.attributes.id, egg.attributes.name));
    };

    const onDetachNode = (node: AdminMountNode) => {
        detachMountNode.mutate(detachAdminMountNodeInput(mountId, node.attributes.id, node.attributes.name));
    };

    const { attributes } = mount;

    return (
        <AdminContentBlock
            title={`管理 · 挂载 · ${attributes.name}`}
            heading={attributes.name}
            description={attributes.uuid}
        >
            <Link
                to='/panel/mounts'
                className='inline-flex items-center text-sm text-muted-foreground mb-4 hover:text-foreground'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回挂载
            </Link>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Dialog.Trigger
                    trigger={({ onClick }) => (
                        <MountDetailsCard form={editForm} mount={mount} error={updateMount.error} onDelete={onClick} />
                    )}
                >
                    {({ open, onClose }) =>
                        open && (
                            <DeleteMountDialog
                                mount={mount}
                                onClose={onClose}
                                onDeleted={() => navigate({ to: '/panel/mounts' })}
                            />
                        )
                    }
                </Dialog.Trigger>
                <div className='flex flex-col gap-4'>
                    <Dialog.Trigger
                        trigger={({ onClick }) => (
                            <AttachedEggsCard
                                eggs={relationshipData(mount.attributes.relationships?.eggs)}
                                onDetach={onDetachEgg}
                                onAttach={onClick}
                            />
                        )}
                    >
                        {({ open, onClose }) =>
                            open && (
                                <AttachEggsModal
                                    key={`${attributes.id}:attach-eggs`}
                                    mount={mount}
                                    open={open}
                                    onClose={onClose}
                                    onAttached={onClose}
                                />
                            )
                        }
                    </Dialog.Trigger>
                    <Dialog.Trigger
                        trigger={({ onClick }) => (
                            <AttachedNodesCard
                                nodes={relationshipData(mount.attributes.relationships?.nodes)}
                                onDetach={onDetachNode}
                                onAttach={onClick}
                            />
                        )}
                    >
                        {({ open, onClose }) =>
                            open && (
                                <AttachNodesModal
                                    key={`${attributes.id}:attach-nodes`}
                                    mount={mount}
                                    open={open}
                                    onClose={onClose}
                                    onAttached={onClose}
                                />
                            )
                        }
                    </Dialog.Trigger>
                </div>
            </div>
        </AdminContentBlock>
    );
};

export default function MountDetailContainer() {
    const loadedMount = mountDetailRoute.useLoaderData();
    const mountId = loadedMount.attributes.id;
    const { data: mount = loadedMount, error } = useAdminMount(mountId);

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} />;
    }

    if (!mount) {
        return (
            <AdminContentBlock title='管理 · 挂载' heading='Mount'>
                <Spinner size='large' centered />
            </AdminContentBlock>
        );
    }

    return <MountDetailContent key={mount.attributes.id} mount={mount} />;
}
