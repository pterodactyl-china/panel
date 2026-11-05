import { useState } from 'react';
import { useAppForm, Form } from '@/components/form';
import type { AdminSettings } from '@/api/admin/settings/queries';
import { useAdminLanguages } from '@/api/admin/languages/queries';
import {
    updateAdminGeneralSettingsInput,
    useClearAdminLogo,
    useUpdateAdminGeneralSettings,
    useUploadAdminLogo,
} from '@/api/admin/settings/queries';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { languageOptions } from '@/components/admin/languageOptions';
import LogoSettingsForm from '@/components/admin/settings/LogoSettingsForm';

export default function GeneralSettingsForm({ settings }: { settings: AdminSettings }) {
    const readOnly = settings.meta.load_environment_only;
    const updateGeneralSettings = useUpdateAdminGeneralSettings();
    const uploadLogo = useUploadAdminLogo();
    const clearLogo = useClearAdminLogo();
    const [pendingLogo, setPendingLogo] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const { data: languages, isLoading: languagesLoading } = useAdminLanguages();
    const languagesList = languageOptions(languages, settings.general['app:locale']);

    const form = useAppForm({
        defaultValues: {
            name: settings.general['app:name'],
            twoFactorRequired: settings.general['pterodactyl:auth:2fa_required'],
            userAvatarsEnabled: settings.general['pterodactyl:client_features:avatars:enabled'],
            locale: settings.general['app:locale'],
        },
        onSubmit: async ({ value }) => {
            if (readOnly) {
                return;
            }

            try {
                await updateGeneralSettings.mutateAsync(updateAdminGeneralSettingsInput(value));

                if (pendingLogo) {
                    await uploadLogo.mutateAsync(pendingLogo);
                    setPendingLogo(null);
                    setRemoveLogo(false);
                } else if (removeLogo) {
                    await clearLogo.mutateAsync();
                    setRemoveLogo(false);
                }
            } catch {
                // Error toasts are handled by the mutations.
            }
        },
    });

    return (
        <Form form={form}>
            <TitledGreyBox title='常规'>
                <form.AppField name='name'>
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='app_name'
                            label='公司名称'
                            description='您的公司名称，将在整个面板中显示。'
                            disabled={readOnly}
                        />
                    )}
                </form.AppField>
                <LogoSettingsForm
                    settings={settings}
                    pendingFile={pendingLogo}
                    removePending={removeLogo}
                    disabled={uploadLogo.isPending || clearLogo.isPending}
                    onFileSelected={(file) => {
                        setPendingLogo(file ?? null);
                        setRemoveLogo(false);
                    }}
                    onRemove={() => {
                        setPendingLogo(null);
                        setRemoveLogo(true);
                    }}
                />
                <div className='mt-4'>
                    <form.AppField name='twoFactorRequired'>
                        {(field) => (
                            <field.SelectField
                                id='twoFactorRequired'
                                label='要求两步验证'
                                options={[
                                    { value: 0, label: '非必需' },
                                    { value: 1, label: '仅管理员必需' },
                                    { value: 2, label: '所有用户必需' },
                                ]}
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-4'>
                    <form.AppField name='locale'>
                        {(field) => (
                            <field.SelectField
                                id='app_locale'
                                label='默认语言'
                                options={languagesList}
                                disabled={readOnly || (languagesLoading && !languages)}
                                placeholder='选择语言'
                                description='面板使用的默认语言。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='userAvatarsEnabled'>
                        {(field) => (
                            <field.SwitchField
                                label='用户头像'
                                description='是否允许用户在其个人资料中使用自定义头像？'
                                disabled={readOnly}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='flex justify-end mt-4'>
                    <form.AppForm>
                        <form.SubmitButton
                            disabled={
                                readOnly ||
                                updateGeneralSettings.isPending ||
                                uploadLogo.isPending ||
                                clearLogo.isPending
                            }
                        >
                            保存更改
                        </form.SubmitButton>
                    </form.AppForm>
                </div>
            </TitledGreyBox>
        </Form>
    );
}
