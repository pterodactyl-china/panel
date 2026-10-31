import { useAppForm, Form } from '@/components/form';
import type { AdminSettings } from '@/api/admin/settings/queries';
import { updateAdminAdvancedSettingsInput, useUpdateAdminAdvancedSettings } from '@/api/admin/settings/queries';
import { type NumberInputValue, requiredNumber, submittedNumber } from '@/components/admin/numberInput';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Alert } from '@/components/elements/alert';

interface AdvancedSettingsFormValues {
    recaptchaEnabled: boolean;
    recaptchaSecretKey: string;
    recaptchaWebsiteKey: string;
    guzzleTimeout: NumberInputValue;
    guzzleConnectTimeout: NumberInputValue;
    allocationsEnabled: boolean;
    allocationsRangeStart: string;
    allocationsRangeEnd: string;
}

const advancedSettingsFormValues = (settings: AdminSettings): AdvancedSettingsFormValues => ({
    recaptchaEnabled: settings.advanced['recaptcha:enabled'],
    recaptchaSecretKey: '',
    recaptchaWebsiteKey: settings.advanced['recaptcha:website_key'],
    guzzleTimeout: settings.advanced['pterodactyl:guzzle:timeout'],
    guzzleConnectTimeout: settings.advanced['pterodactyl:guzzle:connect_timeout'],
    allocationsEnabled: settings.advanced['pterodactyl:client_features:allocations:enabled'],
    allocationsRangeStart: String(settings.advanced['pterodactyl:client_features:allocations:range_start'] ?? ''),
    allocationsRangeEnd: String(settings.advanced['pterodactyl:client_features:allocations:range_end'] ?? ''),
});

export default function AdvancedSettingsForm({ settings }: { settings: AdminSettings }) {
    const readOnly = settings.meta.load_environment_only;
    const updateAdvancedSettings = useUpdateAdminAdvancedSettings();

    const form = useAppForm({
        defaultValues: advancedSettingsFormValues(settings),
        onSubmit: async ({ value }) => {
            if (readOnly) {
                return;
            }

            try {
                await updateAdvancedSettings.mutateAsync(
                    updateAdminAdvancedSettingsInput({
                        recaptchaEnabled: value.recaptchaEnabled,
                        recaptchaSecretKey: value.recaptchaSecretKey,
                        recaptchaWebsiteKey: value.recaptchaWebsiteKey,
                        guzzleTimeout: submittedNumber(value.guzzleTimeout),
                        guzzleConnectTimeout: submittedNumber(value.guzzleConnectTimeout),
                        allocationsEnabled: value.allocationsEnabled,
                        allocationsRangeStart:
                            value.allocationsRangeStart === '' ? '' : Number(value.allocationsRangeStart),
                        allocationsRangeEnd: value.allocationsRangeEnd === '' ? '' : Number(value.allocationsRangeEnd),
                    })
                );
                form.reset({ ...value, recaptchaSecretKey: '' });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    return (
        <Form form={form}>
            <TitledGreyBox title='reCAPTCHA'>
                {settings.meta.show_recaptcha_warning && (
                    <Alert type='warning' className='mb-6 text-sm'>
                        <span>
                            您正在使用面板自带的 reCAPTCHA 密钥。请为本站生成新的隐形 reCAPTCHA 密钥以提升安全性。
                        </span>
                    </Alert>
                )}
                <form.AppField name='recaptchaEnabled'>
                    {(field) => (
                        <field.SwitchField
                            label='已启用 reCAPTCHA'
                            description='使用 reCAPTCHA 保护登录与注册表单。'
                            disabled={readOnly}
                        />
                    )}
                </form.AppField>
                <div className='mt-6'>
                    <form.AppField name='recaptchaWebsiteKey'>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='recaptcha_website_key'
                                label='reCAPTCHA 站点密钥'
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='recaptchaSecretKey'>
                        {(field) => (
                            <field.TextField
                                type='password'
                                id='recaptcha_secret_key'
                                label='reCAPTCHA 密钥'
                                description='留空则保留现有的密钥。'
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
            </TitledGreyBox>
            <TitledGreyBox title='HTTP 连接' className='mt-6'>
                <div className='grid grid-cols-2 gap-4'>
                    <form.AppField
                        name='guzzleTimeout'
                        validators={{ onChange: requiredNumber('必须提供 HTTP 请求超时时间。') }}
                    >
                        {(field) => <field.NumberField id='guzzle_timeout' label='HTTP 请求超时' disabled={readOnly} />}
                    </form.AppField>
                    <form.AppField
                        name='guzzleConnectTimeout'
                        validators={{ onChange: requiredNumber('必须提供 HTTP 连接超时时间。') }}
                    >
                        {(field) => (
                            <field.NumberField id='guzzle_connect_timeout' label='HTTP 连接超时' disabled={readOnly} />
                        )}
                    </form.AppField>
                </div>
            </TitledGreyBox>
            <TitledGreyBox title='自动创建端口' className='mt-6'>
                <form.AppField name='allocationsEnabled'>
                    {(field) => (
                        <field.SwitchField
                            label='已启用自动创建端口'
                            description='允许用户为其服务器自动创建新的端口。'
                            disabled={readOnly}
                        />
                    )}
                </form.AppField>
                <div className='mt-6 grid grid-cols-2 gap-4'>
                    <form.AppField name='allocationsRangeStart'>
                        {(field) => (
                            <field.TextField
                                type='number'
                                id='allocations_range_start'
                                label='起始端口'
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name='allocationsRangeEnd'>
                        {(field) => (
                            <field.TextField
                                type='number'
                                id='allocations_range_end'
                                label='结束端口'
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
            </TitledGreyBox>
            <div className='flex justify-end mt-6'>
                <form.AppForm>
                    <form.SubmitButton disabled={readOnly}>保存更改</form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    );
}
