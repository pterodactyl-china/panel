import { useStore } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { createAdminDatabaseHostInput, useCreateAdminDatabaseHost } from '@/api/admin/database-hosts/queries';
import {
    databaseHostBodyFromFormValues,
    databaseHostValidators,
    newDatabaseHostFormValues,
} from '@/components/admin/databases/databaseHostForm';
import DatabaseHostNodeSelect from '@/components/admin/databases/DatabaseHostNodeSelect';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { useExtensionPayload } from '@/extensions/forms';
import Icon from '@/components/elements/Icon';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { useAppForm, Form } from '@/components/form';

export default function CreateDatabaseHostForm() {
    const navigate = useNavigate();
    const createDatabaseHost = useCreateAdminDatabaseHost();

    const { withExtensionPayload } = useExtensionPayload('admin.database_host');
    const form = useAppForm({
        defaultValues: newDatabaseHostFormValues(),
        onSubmit: async ({ value }) => {
            try {
                const host = await createDatabaseHost.mutateAsync(
                    createAdminDatabaseHostInput(databaseHostBodyFromFormValues(withExtensionPayload(value)))
                );

                void navigate({ to: '/panel/databases/$id', params: { id: host.attributes.id } });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const nodeId = useStore(form.store, (state) => state.values.nodeId);

    return (
        <AdminContentBlock
            title='管理 · 创建数据库主机'
            heading='创建数据库主机'
            description='添加供服务器数据库使用的数据库主机。'
        >
            <Link
                to='/panel/databases'
                className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回数据库主机
            </Link>
            <Form form={form}>
                <div className='space-y-6'>
                    <TitledGreyBox title='主机详情'>
                        <div className='space-y-6'>
                            <form.AppField name='name' validators={databaseHostValidators.name}>
                                {(field) => (
                                    <field.TextField
                                        type='text'
                                        id='name'
                                        label='名称'
                                        description='用于标识此主机的简短易读名称。'
                                    />
                                )}
                            </form.AppField>
                            <div className='grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-6'>
                                <form.AppField name='host' validators={databaseHostValidators.host}>
                                    {(field) => (
                                        <field.TextField
                                            type='text'
                                            id='host'
                                            label='主机'
                                            description='此数据库服务器可访问的主机名或 IP 地址。'
                                        />
                                    )}
                                </form.AppField>
                                <form.AppField name='port' validators={databaseHostValidators.port}>
                                    {(field) => <field.NumberField id='port' label='端口' />}
                                </form.AppField>
                            </div>
                            <DatabaseHostNodeSelect
                                id='nodeId'
                                value={nodeId}
                                onChange={(value) => form.setFieldValue('nodeId', value)}
                            />
                        </div>
                    </TitledGreyBox>
                    <TitledGreyBox title='凭据'>
                        <form.AppField name='username' validators={databaseHostValidators.username}>
                            {(field) => (
                                <field.TextField
                                    type='text'
                                    id='username'
                                    label='用户名'
                                    description='数据库服务器上具有创建用户和数据库权限的用户。'
                                />
                            )}
                        </form.AppField>
                        <div className='mt-6'>
                            <form.AppField name='password' validators={databaseHostValidators.requiredPassword}>
                                {(field) => (
                                    <field.TextField
                                        type='password'
                                        id='password'
                                        label='密码'
                                        description='用于连接此主机的账户密码。'
                                    />
                                )}
                            </form.AppField>
                        </div>
                    </TitledGreyBox>
                    <form.AppField name='extensions'>
                        {() => (
                            <ExtensionFormFields
                                form='admin.database_host'
                                mode='create'
                                error={createDatabaseHost.error}
                                boxed
                            />
                        )}
                    </form.AppField>
                    <div className='flex justify-end'>
                        <form.AppForm>
                            <form.SubmitButton>创建主机</form.SubmitButton>
                        </form.AppForm>
                    </div>
                </div>
            </Form>
        </AdminContentBlock>
    );
}
