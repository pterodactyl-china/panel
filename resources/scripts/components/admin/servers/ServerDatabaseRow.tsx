import { useStore } from '@tanstack/react-form';
import { jdbcConnectionString, serverDatabaseShortName } from '@/lib/databases';
import { Eye } from 'lucide-react';
import { useAppForm, Form, type AppForm } from '@/components/form';
import {
    type AdminServerDatabase,
    deleteAdminServerDatabaseInput,
    rotateAdminServerDatabasePasswordInput,
    useDeleteAdminServerDatabase,
    useRotateAdminServerDatabasePassword,
} from '@/api/admin/servers/queries';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Label from '@/components/elements/Label';
import { TextInput } from '@/components/form/controls';
import Button from '@/components/elements/Button';
import CopyOnClick from '@/components/elements/CopyOnClick';
import SecretInput from '@/components/elements/SecretInput';
import { DeleteAction, RowActionButton, RowActions } from '@/components/elements/table/RowActions';
import { relationshipAttributes } from '@/api/relationships';

export interface ServerDatabaseRowProps {
    serverId: number;
    database: AdminServerDatabase;
}

type ServerDatabaseDialogProps = ServerDatabaseRowProps & {
    open: boolean;
    onClose: () => void;
};

function DeleteDatabaseConfirmForm({
    form,
    databaseName,
    onCancel,
}: {
    form: AppForm<{ confirm: string }>;
    databaseName: string;
    onCancel: () => void;
}) {
    return (
        <Form form={form} className='m-0 mt-6'>
            <form.AppField
                name='confirm'
                validators={{
                    onChange: ({ value }) =>
                        value === databaseName || value === serverDatabaseShortName(databaseName)
                            ? undefined
                            : '必须提供数据库名称。',
                }}
            >
                {(field) => (
                    <field.TextField
                        type='text'
                        id='confirm_name'
                        label='确认数据库名称'
                        description='输入数据库名称以确认删除。'
                    />
                )}
            </form.AppField>
            <div className='mt-6 text-right'>
                <Button type='button' isSecondary className='mr-2' onClick={onCancel}>
                    取消
                </Button>
                <form.AppForm>
                    <form.SubmitButton color='red'>删除数据库</form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    );
}

function DeleteServerDatabaseDialog({ serverId, database, open, onClose }: ServerDatabaseDialogProps) {
    const deleteDatabase = useDeleteAdminServerDatabase();
    const databaseAttributes = database.attributes;

    const form = useAppForm({
        defaultValues: { confirm: '' },
        onSubmit: async () => {
            try {
                await deleteDatabase.mutateAsync(
                    deleteAdminServerDatabaseInput(serverId, databaseAttributes.id, databaseAttributes.name)
                );
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
            title='确认删除数据库'
            preventExternalClose={isSubmitting}
            hideCloseIcon={isSubmitting}
            onClose={onClose}
        >
            <SpinnerOverlay visible={isSubmitting} />
            <p className='text-sm'>
                删除数据库是不可撤销的操作。这将永久删除数据库 <strong>{databaseAttributes.name}</strong>{' '}
                ，并移除所有关联数据。
            </p>
            <DeleteDatabaseConfirmForm form={form} databaseName={databaseAttributes.name} onCancel={onClose} />
        </Dialog>
    );
}

function ServerDatabaseConnectionDialog({ serverId, database, open, onClose }: ServerDatabaseDialogProps) {
    const rotatePassword = useRotateAdminServerDatabasePassword();
    const databaseAttributes = database.attributes;
    const connectionString = `${databaseAttributes.host.address}:${databaseAttributes.host.port}`;
    const password = relationshipAttributes(databaseAttributes.relationships?.password)?.password;

    const jdbcConnection = jdbcConnectionString({
        connectionString,
        name: databaseAttributes.name,
        password,
        username: databaseAttributes.username,
    });

    const rotate = () => {
        rotatePassword.mutate(rotateAdminServerDatabasePasswordInput(serverId, databaseAttributes.id));
    };

    return (
        <Dialog open={open} title='数据库连接详情' onClose={onClose}>
            <div>
                <Label>端点</Label>
                <CopyOnClick text={connectionString}>
                    <TextInput type='text' readOnly value={connectionString} />
                </CopyOnClick>
            </div>
            <div className='mt-6'>
                <Label>允许连接来源</Label>
                <TextInput type='text' readOnly value={databaseAttributes.connections_from} />
            </div>
            <div className='mt-6'>
                <Label>最大连接数</Label>
                <TextInput type='text' readOnly value={databaseAttributes.max_connections ?? '无限制'} />
            </div>
            <div className='mt-6'>
                <Label>用户名</Label>
                <CopyOnClick text={databaseAttributes.username}>
                    <TextInput type='text' readOnly value={databaseAttributes.username} />
                </CopyOnClick>
            </div>
            <div className='mt-6'>
                <Label>密码</Label>
                <SecretInput value={password} label='密码' />
            </div>
            <div className='mt-6'>
                <Label>JDBC 连接字符串</Label>
                <CopyOnClick text={jdbcConnection} showInNotification={false}>
                    <TextInput type='text' readOnly value={jdbcConnection} />
                </CopyOnClick>
            </div>
            <div className='mt-6 text-right'>
                <Button
                    isSecondary
                    color='primary'
                    className='mr-2'
                    onClick={rotate}
                    isLoading={rotatePassword.isPending}
                >
                    轮换密码
                </Button>
                <Button isSecondary onClick={onClose}>
                    关闭
                </Button>
            </div>
        </Dialog>
    );
}

export function ServerDatabaseActions({ serverId, database }: ServerDatabaseRowProps) {
    const { name } = database.attributes;

    return (
        <RowActions>
            <Dialog.Trigger
                trigger={({ onClick }) => (
                    <RowActionButton
                        icon={Eye}
                        label='连接详情'
                        aria-label={`查看 ${name} 的连接详情`}
                        onClick={onClick}
                    />
                )}
            >
                {({ open, onClose }) => (
                    <ServerDatabaseConnectionDialog
                        serverId={serverId}
                        database={database}
                        open={open}
                        onClose={onClose}
                    />
                )}
            </Dialog.Trigger>
            <Dialog.Trigger trigger={({ onClick }) => <DeleteAction aria-label={`删除 ${name}`} onClick={onClick} />}>
                {({ open, onClose }) => (
                    <DeleteServerDatabaseDialog serverId={serverId} database={database} open={open} onClose={onClose} />
                )}
            </Dialog.Trigger>
        </RowActions>
    );
}
