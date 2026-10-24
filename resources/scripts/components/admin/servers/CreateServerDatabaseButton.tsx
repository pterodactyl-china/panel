import { useStore } from '@tanstack/react-form';
import { useAppForm, Form } from '@/components/form';
import { createAdminServerDatabaseInput, useCreateAdminServerDatabase } from '@/api/admin/servers/queries';
import { createServerDatabaseBodyFromFormValues } from '@/components/admin/servers/helpers';
import { useAllAdminDatabaseHosts } from '@/api/admin/database-hosts/queries';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Button from '@/components/elements/Button';
import { NewButton } from '@/components/elements/NewButton';

interface Props {
    serverId: number;
}

type CreateServerDatabaseDialogProps = Props & {
    open: boolean;
    onClose: () => void;
};

const validateDatabaseName = ({ value }: { value: string }): string | undefined => {
    if (value.length < 1) {
        return '必须提供数据库名称。';
    }

    if (value.length > 48) {
        return '数据库名称不得超过 48 个字符。';
    }

    return undefined;
};

function CreateServerDatabaseDialog({ serverId, open, onClose }: CreateServerDatabaseDialogProps) {
    const createDatabase = useCreateAdminServerDatabase();

    const { data: hosts = [] } = useAllAdminDatabaseHosts({ enabled: open });

    const form = useAppForm({
        defaultValues: { databaseName: '', connectionsFrom: '', databaseHostId: 0, maxConnections: '' },
        onSubmit: async ({ value }) => {
            try {
                await createDatabase.mutateAsync(
                    createAdminServerDatabaseInput(
                        serverId,
                        createServerDatabaseBodyFromFormValues({
                            databaseName: value.databaseName,
                            connectionsFrom: value.connectionsFrom || '%',
                            databaseHostId: Number(value.databaseHostId),
                            maxConnections: value.maxConnections === '' ? null : Number(value.maxConnections),
                        })
                    )
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
            title='创建新数据库'
            preventExternalClose={isSubmitting}
            hideCloseIcon={isSubmitting}
            onClose={onClose}
        >
            <SpinnerOverlay visible={isSubmitting} />
            <Form form={form} className='m-0'>
                <form.AppField name='databaseName' validators={{ onChange: validateDatabaseName }}>
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='database_name'
                            label='数据库名称'
                            description='数据库实例的描述性名称。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6'>
                    <form.AppField name='databaseHostId'>
                        {(field) => (
                            <field.SelectField
                                id='database_host_id'
                                label='数据库主机'
                                description='此数据库将创建在该主机上。'
                                options={[
                                    { value: 0, label: '选择数据库主机...', disabled: true },
                                    ...hosts.map((host) => ({
                                        value: host.attributes.id,
                                        label: `${host.attributes.name} (${host.attributes.host}:${host.attributes.port})`,
                                    })),
                                ]}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='connectionsFrom'>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='connections_from'
                                label='允许连接来源'
                                description='允许连接的来源。留空则允许任意来源连接。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='maxConnections'>
                        {(field) => (
                            <field.TextField
                                type='number'
                                min={0}
                                id='max_connections'
                                label='最大连接数'
                                description='此数据库用户允许的最大并发连接数。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='flex flex-wrap justify-end mt-6'>
                    <Button type='button' isSecondary className='w-full sm:w-auto sm:mr-2' onClick={onClose}>
                        取消
                    </Button>
                    <form.AppForm>
                        <form.SubmitButton className='w-full mt-4 sm:w-auto sm:mt-0'>创建数据库</form.SubmitButton>
                    </form.AppForm>
                </div>
            </Form>
        </Dialog>
    );
}

export default function CreateServerDatabaseButton(props: Props) {
    return (
        <Dialog.Trigger trigger={({ onClick }) => <NewButton onClick={onClick}>新建数据库</NewButton>}>
            {({ open, onClose }) => <CreateServerDatabaseDialog {...props} open={open} onClose={onClose} />}
        </Dialog.Trigger>
    );
}
