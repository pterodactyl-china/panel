import { ArrowLeft } from 'lucide-react';
import { Icon, PanelLink, ServerContentBlock, Spinner } from '@/sdk';
import { View, type ViewProps } from '@/sdk/theme';

export default function CreateSubuserPage({ model, className }: ViewProps<'page.server.users.create'>) {
    return (
        <ServerContentBlock title='创建子用户' className={className}>
            <PanelLink
                destination={{ to: '/server/$id/users', params: { id: model.serverId } }}
                className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回用户
            </PanelLink>
            {model.loading ? <Spinner size='large' centered /> : <View name='server.subuserForm' />}
        </ServerContentBlock>
    );
}
