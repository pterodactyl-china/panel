import AdminContentBlock from '@/components/admin/AdminContentBlock';
import { View } from '@/views/View';

export default function ActivityContainer() {
    return (
        <AdminContentBlock
            title='管理 · 活动'
            heading='活动'
            description='通过管理面板执行的操作，按时间倒序显示。服务器与账户活动仍保留在各自页面。'
        >
            <View name='activity.log' scope='admin' />
        </AdminContentBlock>
    );
}
