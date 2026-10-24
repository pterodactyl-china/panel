import { useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useAppForm, Form } from '@/components/form';
import { httpErrorToHuman } from '@/api/http';
import { createAdminEggInput, useAdminEggs, useCreateAdminEgg } from '@/api/admin/eggs/queries';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { useExtensionPayload } from '@/extensions/forms';
import Icon from '@/components/elements/Icon';
import Spinner from '@/components/elements/Spinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import EggConfigurationFields from '@/components/admin/eggs/EggConfigurationForm';
import { emptyEggFormValues, toApiValues } from '@/components/admin/eggs/helpers';
import type { CodemirrorEditorHandle } from '@/components/elements/LazyCodemirrorEditor';

export default function CreateEggForm() {
    const navigate = useNavigate();

    const logsEditor = useRef<CodemirrorEditorHandle | null>(null);
    const filesEditor = useRef<CodemirrorEditorHandle | null>(null);
    const startupEditor = useRef<CodemirrorEditorHandle | null>(null);

    const { data: eggs, isFetching: eggsFetching, error: eggsError } = useAdminEggs();
    const createEgg = useCreateAdminEgg();

    const { withExtensionPayload } = useExtensionPayload('admin.egg');
    const form = useAppForm({
        defaultValues: emptyEggFormValues(),
        onSubmit: async ({ value }) => {
            try {
                const configLogs = logsEditor.current?.getValue() ?? '';
                const configFiles = filesEditor.current?.getValue() ?? '';
                const configStartup = startupEditor.current?.getValue() ?? '';
                const egg = await createEgg.mutateAsync(
                    createAdminEggInput(
                        toApiValues(withExtensionPayload(value), {
                            configLogs,
                            configFiles,
                            configStartup,
                        })
                    )
                );

                void navigate({
                    to: '/panel/eggs/$eggId',
                    params: { eggId: egg.attributes.id },
                });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    if (eggsError) {
        return <ServerError message={httpErrorToHuman(eggsError)} />;
    }

    return (
        <AdminContentBlock title='管理 · 创建预设' heading='创建预设' description='创建可复用的服务器模板与启动配置。'>
            <Link
                to='/panel/eggs'
                className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回预设
            </Link>
            {eggsFetching ? (
                <Spinner size='large' centered />
            ) : (
                <Form form={form}>
                    <EggConfigurationFields
                        form={form}
                        eggs={eggs?.data ?? []}
                        initialConfigLogs=''
                        initialConfigFiles=''
                        initialConfigStartup=''
                        logRef={logsEditor}
                        filesRef={filesEditor}
                        startupRef={startupEditor}
                    />
                    <form.AppField name='extensions'>
                        {() => (
                            <ExtensionFormFields
                                form='admin.egg'
                                mode='create'
                                error={createEgg.error}
                                boxed
                                className='mt-4'
                            />
                        )}
                    </form.AppField>
                    <div className='flex justify-end mt-6'>
                        <form.AppForm>
                            <form.SubmitButton>创建预设</form.SubmitButton>
                        </form.AppForm>
                    </div>
                </Form>
            )}
        </AdminContentBlock>
    );
}
