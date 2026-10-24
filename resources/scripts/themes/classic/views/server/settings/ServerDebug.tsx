import { Card, CopyOnClick } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function ServerDebug({ model, className }: ViewProps<'server.debug'>) {
    return (
        <Card title='调试信息' className={className}>
            <div className='flex items-center justify-between text-sm'>
                <p>节点</p>
                <code className='font-mono bg-muted rounded-sm py-1 px-2'>{model.node}</code>
            </div>
            <CopyOnClick text={model.uuid}>
                <div className='flex items-center justify-between mt-2 text-sm'>
                    <p>服务器 ID</p>
                    <code className='font-mono bg-muted rounded-sm py-1 px-2'>{model.uuid}</code>
                </div>
            </CopyOnClick>
        </Card>
    );
}
