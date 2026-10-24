import { Button, ContentBox } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import DisableTwoFactorDialog from './DisableTwoFactorDialog';
import RecoveryTokensDialog from './RecoveryTokensDialog';
import SetupTwoFactorDialog from './SetupTwoFactorDialog';

export default function TwoFactorCard({ model, className }: ViewProps<'account.twoFactor'>) {
    return (
        <ContentBox className={className} title='两步验证'>
            <div>
                <SetupTwoFactorDialog model={model} />
                <RecoveryTokensDialog tokens={model.recoveryTokens} onClose={model.dismissRecoveryTokens} />
                <DisableTwoFactorDialog model={model} />
                <p className='text-sm'>
                    {model.enabled
                        ? '您的账户目前已启用两步验证。'
                        : '您的账户尚未启用两步验证。点击下方按钮开始配置。'}
                </p>
                <div className='mt-6'>
                    {model.enabled ? (
                        <Button.Danger onClick={() => model.openDialog('disable')}>禁用两步验证</Button.Danger>
                    ) : (
                        <Button onClick={() => model.openDialog('enable')}>启用两步验证</Button>
                    )}
                </div>
            </div>
        </ContentBox>
    );
}
