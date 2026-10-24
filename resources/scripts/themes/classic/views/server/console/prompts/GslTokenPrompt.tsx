import { Dialog, Form, SpinnerOverlay, useAppForm } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function GslTokenPrompt({ model }: ViewProps<'server.feature.gslToken'>) {
    const form = useAppForm({
        defaultValues: { gslToken: '' },
        onSubmit: async ({ value }) => {
            // The failure has already been reported.
            await model.submit(value.gslToken).catch(() => {});
        },
    });

    return (
        <Dialog
            open={model.open}
            title='GSL 令牌无效'
            onClose={model.close}
            preventExternalClose={model.pending}
            hideCloseIcon={model.pending}
        >
            <SpinnerOverlay visible={model.pending} />
            <Form form={form}>
                <p className='mt-4'>您的游戏服务器登录令牌（GSL 令牌）似乎无效或已过期。</p>
                <p className='mt-4'>您可以生成新的令牌并填入下方，或将此字段留空以完全移除。</p>
                <div className='sm:flex items-center mt-4'>
                    <form.AppField name='gslToken'>
                        {(field) => (
                            <field.TextField
                                label='GSL 令牌'
                                description='访问 https://steamcommunity.com/dev/managegameservers 生成令牌。'
                                autoFocus
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-8 sm:flex items-center justify-end'>
                    <div className='mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto'>
                        <form.AppForm>
                            <form.SubmitButton className='w-full sm:w-auto'>更新 GSL 令牌</form.SubmitButton>
                        </form.AppForm>
                    </div>
                </div>
            </Form>
        </Dialog>
    );
}
