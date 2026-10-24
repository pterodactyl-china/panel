import { useMemo } from 'react';
import { Database, Eye } from 'lucide-react';
import {
    actionsColumn,
    Button,
    CopyOnClick,
    DeleteAction,
    Dialog,
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    Form,
    Input,
    Label,
    ListToolbar,
    NewButton,
    RowActionButton,
    RowActions,
    SecretInput,
    Spinner,
    SpinnerOverlay,
    Table,
    useAppForm,
    type TableColumn,
} from '@/sdk';
import type { ServerDatabaseItem, ServerDatabasesModel, ViewProps } from '@/sdk/theme';

interface DatabaseDialogProps {
    model: ServerDatabasesModel;
    database: ServerDatabaseItem;
    open: boolean;
    onClose: () => void;
}

function CreateDatabaseDialog({ model, onClose }: { model: ServerDatabasesModel; onClose: () => void }) {
    const form = useAppForm({
        defaultValues: { databaseName: '', connectionsFrom: '' },
        onSubmit: async ({ value }) => {
            try {
                await model.actions.create({ name: value.databaseName, connectionsFrom: value.connectionsFrom });
                onClose();
            } catch {
                // The failure has already been reported.
            }
        },
    });

    return (
        <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
                <Dialog
                    open
                    title='创建新数据库'
                    preventExternalClose={isSubmitting}
                    hideCloseIcon={isSubmitting}
                    onClose={() => {
                        form.reset();
                        onClose();
                    }}
                >
                    <SpinnerOverlay visible={isSubmitting} />
                    <Form form={form} className='m-0'>
                        <form.AppField
                            name='databaseName'
                            validators={{ onChange: ({ value }) => model.validate.name(value) }}
                        >
                            {(field) => (
                                <field.TextField
                                    type='string'
                                    id='database_name'
                                    label='数据库名称'
                                    description='数据库实例的描述性名称。'
                                />
                            )}
                        </form.AppField>
                        <div className='mt-6'>
                            <form.AppField
                                name='connectionsFrom'
                                validators={{ onChange: ({ value }) => model.validate.connectionsFrom(value) }}
                            >
                                {(field) => (
                                    <field.TextField
                                        type='string'
                                        id='connections_from'
                                        label='允许连接来源'
                                        description='允许连接的来源。留空则允许任意来源连接。'
                                    />
                                )}
                            </form.AppField>
                        </div>
                        <div className='flex flex-wrap justify-end mt-6'>
                            <Button type='button' isSecondary className='w-full sm:w-auto sm:mr-2' onClick={onClose}>
                                取消
                            </Button>
                            <form.AppForm>
                                <form.SubmitButton className='w-full mt-4 sm:w-auto sm:mt-0'>
                                    创建数据库
                                </form.SubmitButton>
                            </form.AppForm>
                        </div>
                    </Form>
                </Dialog>
            )}
        </form.Subscribe>
    );
}

const CreateDatabaseButton = ({ model }: { model: ServerDatabasesModel }) => (
    <Dialog.Trigger trigger={({ onClick }) => <NewButton onClick={onClick}>新建数据库</NewButton>}>
        {({ open, onClose }) => open && <CreateDatabaseDialog model={model} onClose={onClose} />}
    </Dialog.Trigger>
);

function DeleteDatabaseDialog({ model, database, open, onClose }: DatabaseDialogProps) {
    const form = useAppForm({
        defaultValues: { confirm: '' },
        onSubmit: async () => {
            try {
                await model.actions.remove(database.id);
                onClose();
                form.reset();
            } catch {
                // The failure has already been reported.
            }
        },
    });
    const close = () => {
        onClose();
        form.reset();
    };

    return (
        <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
                <Dialog
                    open={open}
                    title='确认删除数据库'
                    preventExternalClose={isSubmitting}
                    hideCloseIcon={isSubmitting}
                    onClose={close}
                >
                    <SpinnerOverlay visible={isSubmitting} />
                    <p className='text-sm'>
                        删除数据库是不可撤销的操作。这将删除 <strong>{database.name}</strong> 及其所有关联数据。
                    </p>
                    <Form form={form} className='m-0 mt-6'>
                        <form.AppField
                            name='confirm'
                            validators={{
                                onChange: ({ value }) =>
                                    value === database.name || value === database.shortName
                                        ? undefined
                                        : '必须提供数据库名称。',
                            }}
                        >
                            {(field) => (
                                <field.TextField
                                    type='text'
                                    id='confirm_name'
                                    label='确认数据库名称'
                                    description='请输入数据库名称以确认删除。'
                                />
                            )}
                        </form.AppField>
                        <div className='mt-6 text-right'>
                            <Button type='button' isSecondary className='mr-2' onClick={close}>
                                取消
                            </Button>
                            <form.AppForm>
                                <form.SubmitButton color='red'>删除数据库</form.SubmitButton>
                            </form.AppForm>
                        </div>
                    </Form>
                </Dialog>
            )}
        </form.Subscribe>
    );
}

function ConnectionDialog({ model, database, open, onClose }: DatabaseDialogProps) {
    return (
        <Dialog open={open} title='数据库连接详情' onClose={onClose}>
            <div>
                <Label>端点</Label>
                <CopyOnClick text={database.endpoint}>
                    <Input type='text' readOnly value={database.endpoint} />
                </CopyOnClick>
            </div>
            <div className='mt-6'>
                <Label>允许连接来源</Label>
                <Input type='text' readOnly value={database.connectionsFrom} />
            </div>
            <div className='mt-6'>
                <Label>用户名</Label>
                <CopyOnClick text={database.username}>
                    <Input type='text' readOnly value={database.username} />
                </CopyOnClick>
            </div>
            {model.permissions.viewPassword && (
                <div className='mt-6'>
                    <Label>密码</Label>
                    <SecretInput value={database.password} label='密码' />
                </div>
            )}
            <div className='mt-6'>
                <Label>JDBC 连接字符串</Label>
                <CopyOnClick text={database.jdbc} showInNotification={false}>
                    <Input type='text' readOnly value={database.jdbc} />
                </CopyOnClick>
            </div>
            <div className='mt-6 flex justify-end gap-2'>
                {model.permissions.update && (
                    <Button
                        isSecondary
                        color='primary'
                        className='mr-2'
                        onClick={() => void model.actions.rotatePassword(database.id).catch(() => {})}
                        isLoading={model.rotating.includes(database.id)}
                    >
                        轮换密码
                    </Button>
                )}
                <Button isSecondary onClick={onClose}>
                    关闭
                </Button>
            </div>
        </Dialog>
    );
}

function DatabaseActions({ model, database }: { model: ServerDatabasesModel; database: ServerDatabaseItem }) {
    return (
        <RowActions>
            <Dialog.Trigger
                trigger={({ onClick }) => (
                    <RowActionButton
                        icon={Eye}
                        label='连接详情'
                        aria-label={`查看 ${database.name} 的连接详情`}
                        onClick={onClick}
                    />
                )}
            >
                {({ open, onClose }) => (
                    <ConnectionDialog model={model} database={database} open={open} onClose={onClose} />
                )}
            </Dialog.Trigger>
            {model.permissions.delete && (
                <Dialog.Trigger
                    trigger={({ onClick }) => <DeleteAction aria-label={`删除 ${database.name}`} onClick={onClick} />}
                >
                    {({ open, onClose }) => (
                        <DeleteDatabaseDialog model={model} database={database} open={open} onClose={onClose} />
                    )}
                </Dialog.Trigger>
            )}
        </RowActions>
    );
}

function databaseColumns(model: ServerDatabasesModel): TableColumn<ServerDatabaseItem>[] {
    return [
        {
            id: 'name',
            label: '数据库',
            sortValue: (database) => database.name,
            cell: (database) => (
                <CopyOnClick text={database.name}>
                    <span className='font-medium'>{database.name}</span>
                </CopyOnClick>
            ),
        },
        {
            id: 'endpoint',
            label: '端点',
            sortValue: (database) => database.endpoint,
            cell: (database) => (
                <CopyOnClick text={database.endpoint}>
                    <code className='whitespace-nowrap text-xs'>{database.endpoint}</code>
                </CopyOnClick>
            ),
            headerClassName: 'hidden md:table-cell',
            cellClassName: 'hidden md:table-cell',
        },
        {
            id: 'connections_from',
            label: '允许连接来源',
            sortValue: (database) => database.connectionsFrom,
            cell: (database) => database.connectionsFrom,
            headerClassName: 'hidden lg:table-cell',
            cellClassName: 'hidden lg:table-cell',
        },
        {
            id: 'username',
            label: '用户名',
            sortValue: (database) => database.username,
            cell: (database) => (
                <CopyOnClick text={database.username}>
                    <code className='text-xs'>{database.username}</code>
                </CopyOnClick>
            ),
            headerClassName: 'hidden xl:table-cell',
            cellClassName: 'hidden xl:table-cell',
        },
        actionsColumn(2, (database) => <DatabaseActions model={model} database={database} />),
    ];
}

const EmptyState = ({ model }: { model: ServerDatabasesModel }) => (
    <Empty size='compact'>
        <EmptyHeader>
            <EmptyMedia variant='icon'>
                <Database />
            </EmptyMedia>
            <EmptyTitle>没有数据库</EmptyTitle>
            <EmptyDescription>
                {model.limit > 0 ? '此服务器还没有任何数据库。' : '无法创建数据库，因为此服务器的数据库上限为 0。'}
            </EmptyDescription>
        </EmptyHeader>
        {model.canCreate && (
            <EmptyContent>
                <CreateDatabaseButton model={model} />
            </EmptyContent>
        )}
    </Empty>
);

export default function Databases({ model, className }: ViewProps<'server.databases'>) {
    const columns = useMemo(() => databaseColumns(model), [model]);
    const count = model.databases.length;
    const usage =
        model.permissions.create && model.limit > 0 && count > 0
            ? `${count} of ${model.limit} databases have been allocated to this server.`
            : null;

    if (model.loading) {
        return (
            <div className={className}>
                <Spinner size='large' centered />
            </div>
        );
    }

    return (
        <div className={className}>
            {(usage || model.canCreate) && (
                <ListToolbar summary={usage}>{model.canCreate && <CreateDatabaseButton model={model} />}</ListToolbar>
            )}
            <Table
                rows={model.databases}
                columns={columns}
                keyOf={(database) => database.id}
                emptyState={<EmptyState model={model} />}
            />
        </div>
    );
}
