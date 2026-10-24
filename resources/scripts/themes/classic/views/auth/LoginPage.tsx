import { Button, PanelLink } from '@/sdk';
import { Slot, type ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';
import AuthCard, { authLinkClass } from './AuthCard';

export default function LoginPage({ model, className }: ViewProps<'page.auth.login'>) {
    const { fields, Captcha } = model;

    return (
        <AuthCard title='登录以继续' submit={model.submit} className={className}>
            <TextField field={fields.username} light label='用户名或电子邮箱' />
            <div className='mt-6'>
                <TextField field={fields.password} light label='密码' />
            </div>
            <div className='mt-6'>
                <Button type='submit' size='xlarge' disabled={!model.canSubmit} isLoading={model.submitting}>
                    登录
                </Button>
            </div>
            <Slot name='auth.login.form.after' data={model.route} />
            {Captcha && <Captcha />}
            <div className='mt-6 text-center'>
                <PanelLink destination={model.forgotPassword} className={authLinkClass}>
                    忘记密码？
                </PanelLink>
            </div>
        </AuthCard>
    );
}
