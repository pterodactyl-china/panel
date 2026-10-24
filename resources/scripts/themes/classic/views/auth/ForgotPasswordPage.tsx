import { Button, PanelLink } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';
import AuthCard, { authLinkClass } from './AuthCard';

export default function ForgotPasswordPage({ model, className }: ViewProps<'page.auth.password'>) {
    const { Captcha } = model;

    return (
        <AuthCard title='请求重置密码' submit={model.submit} className={className}>
            <TextField
                field={model.fields.email}
                light
                label='电子邮箱'
                description='输入您的账户电子邮箱地址，以接收密码重置说明。'
            />
            <div className='mt-6'>
                <Button type='submit' size='xlarge' disabled={!model.canSubmit} isLoading={model.submitting}>
                    发送邮件
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
