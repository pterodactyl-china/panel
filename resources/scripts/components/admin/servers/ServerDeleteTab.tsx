import { useState, type ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { useAppForm, Form } from '@/components/form';
import {
    type AdminServer,
    deleteAdminServerInput,
    forceDeleteAdminServerInput,
    useDeleteAdminServer,
    useForceDeleteAdminServer,
} from '@/api/admin/servers/queries';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Button from '@/components/elements/Button';
import { Alert } from '@/components/elements/alert';

type DeleteMode = 'safe' | 'force';

interface Props {
    server: AdminServer;
}

interface DeleteServerDialogProps extends Props {
    mode: DeleteMode;
    open: boolean;
    onClose: () => void;
}

function DeleteServerDialog({ server, mode, open, onClose }: DeleteServerDialogProps) {
    const { attributes } = server;
    const navigate = useNavigate();
    const deleteServer = useDeleteAdminServer();
    const forceDeleteServer = useForceDeleteAdminServer();

    const form = useAppForm({
        defaultValues: { confirm: '' },
        onSubmit: async () => {
            try {
                if (mode === 'force') {
                    await forceDeleteServer.mutateAsync(forceDeleteAdminServerInput(attributes.id, attributes.name));
                } else {
                    await deleteServer.mutateAsync(deleteAdminServerInput(attributes.id, attributes.name));
                }

                await navigate({ to: '/panel/servers' });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

    const close = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog
            open={open}
            title={mode === 'force' ? '强制删除服务器' : '确认删除服务器'}
            preventExternalClose={isSubmitting}
            hideCloseIcon={isSubmitting}
            onClose={close}
        >
            <SpinnerOverlay visible={isSubmitting} />
            <p className='text-sm'>
                删除服务器是不可撤销的操作。这将永久删除服务器 <strong>{attributes.name}</strong> ，并移除所有关联数据。
                {mode === 'force' && (
                    <span className='block mt-2 text-destructive'>
                        若守护进程报错，强制删除可能在守护进程上遗留残留文件。
                    </span>
                )}
            </p>
            <Form form={form} className='m-0 mt-6'>
                <form.AppField
                    name='confirm'
                    validators={{
                        onChange: ({ value }) => (value === attributes.name ? undefined : '必须提供服务器名称。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id={`confirm_server_name_${mode}`}
                            label='确认服务器名称'
                            description='输入此服务器的名称以确认删除。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6 text-right'>
                    <Button type='button' isSecondary className='mr-2' disabled={isSubmitting} onClick={close}>
                        取消
                    </Button>
                    <form.AppForm>
                        <form.SubmitButton color='red'>
                            {mode === 'force' ? '强制删除服务器' : '删除服务器'}
                        </form.SubmitButton>
                    </form.AppForm>
                </div>
            </Form>
        </Dialog>
    );
}

const DeleteActionCard = ({
    title,
    warning,
    description,
    action,
}: {
    title: string;
    warning: ReactNode;
    description: ReactNode;
    action: ReactNode;
}) => (
    <TitledGreyBox title={title} className='flex h-full flex-col' contentClassName='flex flex-1 flex-col p-0'>
        <div className='flex flex-1 flex-col gap-3 p-3'>
            <Alert type='danger'>
                <strong className='font-semibold'>危险！</strong> {warning}
            </Alert>
            <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='flex items-center justify-end border-t border-border p-3'>{action}</div>
    </TitledGreyBox>
);

function ServerDeleteContent({ server }: Props) {
    const [mode, setMode] = useState<DeleteMode | null>(null);
    const close = () => setMode(null);

    return (
        <div>
            <DeleteServerDialog server={server} mode='safe' open={mode === 'safe'} onClose={close} />
            <DeleteServerDialog server={server} mode='force' open={mode === 'force'} onClose={close} />

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <DeleteActionCard
                    title='安全删除服务器'
                    warning={
                        <>
                            删除服务器是不可撤销的操作。 <strong>所有服务器数据</strong>
                            （包括文件与用户）将从系统中移除。
                        </>
                    }
                    description='此操作将尝试同时从面板和守护进程删除服务器。任一方报错，操作将被取消。'
                    action={
                        <Button color='red' className='whitespace-nowrap' onClick={() => setMode('safe')}>
                            安全删除此服务器
                        </Button>
                    }
                />

                <DeleteActionCard
                    title='强制删除服务器'
                    warning={
                        <>
                            删除服务器是不可撤销的操作。 <strong>所有服务器数据</strong>{' '}
                            将被移除。若守护进程报错，此方式可能在守护进程上遗留残留文件。
                        </>
                    }
                    description='此操作将尝试同时从面板和守护进程删除服务器。如果守护进程无响应或报错，删除仍会继续。'
                    action={
                        <Button color='red' className='whitespace-nowrap' onClick={() => setMode('force')}>
                            强制删除此服务器
                        </Button>
                    }
                />
            </div>
        </div>
    );
}

export default function ServerDeleteTab() {
    const { server } = useServerDetail();

    return <ServerDeleteContent server={server} />;
}
