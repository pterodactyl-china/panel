import { Button, PanelLink } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';
import AuthCard, { authLinkClass } from './AuthCard';

export default function CheckpointPage({ model, className }: ViewProps<'page.auth.checkpoint'>) {
    const { recovery } = model;

    return (
        <AuthCard title='设备验证' submit={model.submit} className={className}>
            <div className='mt-6'>
                <TextField
                    field={model.fields.code}
                    light
                    title={recovery ? '恢复代码' : '验证码'}
                    description={
                        recovery
                            ? '请输入为此账户设置两步验证时生成的恢复代码之一以继续。'
                            : '请输入您的设备生成的两步验证口令。'
                    }
                    autoFocus
                />
            </div>
            <div className='mt-6'>
                <Button type='submit' size='xlarge' disabled={!model.canSubmit} isLoading={model.submitting}>
                    继续
                </Button>
            </div>
            <div className='mt-6 text-center'>
                <button
                    type='button'
                    onClick={model.toggleRecovery}
                    className='cursor-pointer appearance-none border-0 bg-transparent p-0 text-xs text-muted-foreground tracking-wide uppercase no-underline hover:text-foreground'
                >
                    {recovery ? '我有设备' : '我的设备已丢失'}
                </button>
            </div>
            <div className='mt-6 text-center'>
                <PanelLink destination={model.login} className={authLinkClass}>
                    返回登录
                </PanelLink>
            </div>
        </AuthCard>
    );
}
