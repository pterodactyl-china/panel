import { Button, Input, PanelLink } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';
import AuthCard, { authLinkClass } from './AuthCard';

export default function ResetPasswordPage({ model, className }: ViewProps<'page.auth.passwordReset'>) {
    const { fields, Captcha } = model;

    return (
        <AuthCard title='重置密码' submit={model.submit} className={className}>
            <div>
                <label htmlFor='password-reset-email'>电子邮箱</label>
                <Input id='password-reset-email' value={model.email} $isLight disabled />
            </div>
            <div className='mt-6'>
                <TextField field={fields.password} light label='新密码' description='密码长度至少为 8 个字符。' />
            </div>
            <div className='mt-6'>
                <TextField field={fields.passwordConfirmation} light label='确认新密码' />
            </div>
            <div className='mt-6'>
                <Button type='submit' size='xlarge' disabled={!model.canSubmit} isLoading={model.submitting}>
                    重置密码
                </Button>
            </div>
            {Captcha && <Captcha />}
            <div className='mt-6 text-center'>
                <PanelLink destination={model.login} className={authLinkClass}>
                    返回登录
                </PanelLink>
            </div>
        </AuthCard>
    );
}
