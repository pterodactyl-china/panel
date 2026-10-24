import { Link } from '@tanstack/react-router';
import { Tags } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export default function NoTagsYet() {
    return (
        <Empty size='compact'>
            <EmptyHeader>
                <EmptyMedia variant='icon'>
                    <Tags />
                </EmptyMedia>
                <EmptyTitle>暂无标签</EmptyTitle>
                <EmptyDescription>
                    在下方输入名称即可创建，或前往以下页面管理标签： <Link to='/panel/tags'>标签页面</Link>.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
