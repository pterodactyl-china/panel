import { useAppForm, Form } from '@/components/form';
import type { AdminSettings } from '@/api/admin/settings/queries';
import { type MailSettingsValues } from '@/api/admin/settings/queries';
import {
    testAdminMailInput,
    updateAdminMailSettingsInput,
    useSendTestAdminMail,
    useUpdateAdminMailSettings,
} from '@/api/admin/settings/queries';
import { type NumberInputValue, requiredNumber, submittedNumber } from '@/components/admin/numberInput';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Button from '@/components/elements/Button';

type MailSubmitAction = 'save' | 'test';

interface MailSettingsFormValues extends Omit<MailSettingsValues, 'port'> {
    port: NumberInputValue;
}

const mailEncryptionValue = (
    encryption: AdminSettings['mail']['mail:mailers:smtp:encryption']
): MailSettingsValues['encryption'] => (encryption === 'tls' || encryption === 'ssl' ? encryption : '');

const mailSettingsFormValues = (settings: AdminSettings): MailSettingsFormValues => ({
    host: settings.mail['mail:mailers:smtp:host'],
    port: settings.mail['mail:mailers:smtp:port'],
    encryption: mailEncryptionValue(settings.mail['mail:mailers:smtp:encryption']),
    username: settings.mail['mail:mailers:smtp:username'] || '',
    password: '',
    fromAddress: settings.mail['mail:from:address'],
    fromName: settings.mail['mail:from:name'] || '',
});

export default function MailSettingsForm({ settings }: { settings: AdminSettings }) {
    const disabled = settings.mail['mail:default'] !== 'smtp';
    const readOnly = settings.meta.load_environment_only;
    const updateMailSettings = useUpdateAdminMailSettings();
    const updateMailSettingsForTest = useUpdateAdminMailSettings({ successNotification: false });
    const sendTestMail = useSendTestAdminMail();

    const form = useAppForm({
        onSubmitMeta: 'save' as MailSubmitAction,
        defaultValues: mailSettingsFormValues(settings),
        onSubmit: async ({ value, meta }) => {
            if (readOnly) {
                return;
            }

            const input = updateAdminMailSettingsInput({ ...value, port: submittedNumber(value.port) });

            try {
                if (meta === 'test') {
                    await updateMailSettingsForTest.mutateAsync(input);
                    form.reset({ ...value, password: '' });
                    await sendTestMail.mutateAsync(testAdminMailInput());

                    return;
                }

                await updateMailSettings.mutateAsync(input);
                form.reset({ ...value, password: '' });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const sendTestEmail = () => void form.handleSubmit('test');

    if (disabled) {
        return (
            <TitledGreyBox title='邮件配置'>
                <div className='rounded-sm border border-border bg-popover px-4 py-3 text-sm text-foreground'>
                    此界面仅适用于使用 SMTP 作为邮件驱动的实例。请使用 <code>php artisan p:environment:mail</code>{' '}
                    更新邮件设置，或设置 <code>MAIL_DRIVER=smtp</code> 在环境变量文件中。
                </div>
            </TitledGreyBox>
        );
    }

    return (
        <Form form={form}>
            <TitledGreyBox title='邮件配置'>
                <div className='grid grid-cols-2 gap-4'>
                    <form.AppField name='host'>
                        {(field) => (
                            <field.TextField type='text' id='mail_host' label='SMTP 主机' disabled={readOnly} />
                        )}
                    </form.AppField>
                    <form.AppField name='port' validators={{ onChange: requiredNumber('必须提供 SMTP 端口。') }}>
                        {(field) => <field.NumberField id='mail_port' label='SMTP 端口' disabled={readOnly} />}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='encryption'>
                        {(field) => (
                            <field.SelectField
                                id='mail_encryption'
                                label='加密方式'
                                options={[
                                    { value: '', label: '无' },
                                    { value: 'tls', label: '传输层安全 (TLS)' },
                                    { value: 'ssl', label: '安全套接层 (SSL)' },
                                ]}
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='username'>
                        {(field) => (
                            <field.TextField type='text' id='mail_username' label='用户名' disabled={readOnly} />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='password'>
                        {(field) => (
                            <field.TextField
                                type='password'
                                id='mail_password'
                                label='密码'
                                description='留空则保留现有密码。输入 !e 可清除密码。'
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6 grid grid-cols-2 gap-4'>
                    <form.AppField name='fromAddress'>
                        {(field) => (
                            <field.TextField type='text' id='mail_from_address' label='发件地址' disabled={readOnly} />
                        )}
                    </form.AppField>
                    <form.AppField name='fromName'>
                        {(field) => (
                            <field.TextField type='text' id='mail_from_name' label='发件人名称' disabled={readOnly} />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6 flex flex-wrap justify-end'>
                    <form.Subscribe
                        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                type='button'
                                isSecondary
                                className='w-full sm:w-auto sm:mr-2'
                                disabled={readOnly || !canSubmit}
                                isLoading={isSubmitting}
                                onClick={sendTestEmail}
                            >
                                发送测试邮件
                            </Button>
                        )}
                    </form.Subscribe>
                    <form.AppForm>
                        <form.SubmitButton disabled={readOnly}>保存更改</form.SubmitButton>
                    </form.AppForm>
                </div>
            </TitledGreyBox>
        </Form>
    );
}
