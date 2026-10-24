import { Alert, cn, PageContentBlock, PageHeading } from '@/sdk';
import { Slot, View, type ViewProps } from '@/sdk/theme';

const CARD_WIDTH = 'w-full sm:w-[calc(50%_-_1rem)] md:w-auto md:flex-1';

export default function AccountOverview({ model, className }: ViewProps<'page.account.overview'>) {
    return (
        <PageContentBlock title='账户概览' className={className}>
            <PageHeading title='账户' description='管理您的个人资料、凭据与账户安全。' />
            {model.twoFactorRequired && (
                <Alert title='需要两步验证' type='danger'>
                    您的账户必须启用两步验证才能继续。
                </Alert>
            )}
            <Slot name='account.overview.before' />
            <div className={cn('flex flex-wrap lg:grid lg:grid-cols-3 mb-10', model.twoFactorRequired && 'mt-4')}>
                <View name='account.password' className={CARD_WIDTH} />
                <View name='account.email' className={cn(CARD_WIDTH, 'mt-8 sm:mt-0 sm:ml-8')} />
                <View name='account.twoFactor' className={cn(CARD_WIDTH, 'mt-8 md:mt-0 md:ml-8')} />
            </div>
            {model.userAvatarsEnabled && (
                <div className='flex flex-wrap lg:grid lg:grid-cols-3 mb-10'>
                    <View name='account.avatar' className={CARD_WIDTH} />
                </div>
            )}
            <Slot name='account.overview.after' />
        </PageContentBlock>
    );
}
