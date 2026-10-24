import { PageContentBlock } from '@/sdk';
import { View, type ViewProps } from '@/sdk/theme';

export default function AccountActivityPage({ className }: ViewProps<'page.account.activity'>) {
    return (
        <PageContentBlock title='账户活动记录' className={className}>
            <View name='activity.log' scope='account' />
        </PageContentBlock>
    );
}
