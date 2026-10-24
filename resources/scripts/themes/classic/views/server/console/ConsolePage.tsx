import { Alert, ServerContentBlock } from '@/sdk';
import { Slot, View, type ServerConsoleModel, type ViewProps } from '@/sdk/theme';

const notices = {
    maintenance: '此服务器所在节点正在维护，所有操作均不可用。',
    installing: '此服务器正在安装中，大部分操作不可用。',
    transferring: '此服务器正在转移到其他节点，所有操作均不可用。',
} satisfies Record<NonNullable<ServerConsoleModel['notice']>, string>;

export default function ConsolePage({ model, active, className }: ViewProps<'page.server.console'>) {
    return (
        <ServerContentBlock title={active ? 'Console' : undefined} className={className}>
            {model.notice && (
                <Alert type='warning' className='mb-4'>
                    {notices[model.notice]}
                </Alert>
            )}
            <Slot name='server.console.before' data={model.server} />
            <div className='grid grid-cols-4 gap-4 mb-4'>
                <div className='hidden sm:block sm:col-span-2 lg:col-span-3 pr-4'>
                    <h1 className='font-header font-medium text-2xl text-foreground leading-relaxed line-clamp-1'>
                        {model.name}
                    </h1>
                    <p className='text-sm line-clamp-2'>{model.description}</p>
                </div>
                <div className='col-span-4 sm:col-span-2 lg:col-span-1 self-end'>
                    <View name='server.power' />
                </div>
            </div>
            <div className='grid grid-cols-4 gap-2 sm:gap-4 mb-4'>
                <div className='flex col-span-4 lg:col-span-3'>
                    <View name='server.terminal' />
                </div>
                <View name='server.stats' className='col-span-4 lg:col-span-1 order-last lg:order-0' />
            </div>
            <View name='server.graphs' />
            <Slot name='server.console.after' data={model.server} />
            {model.features.map((name) => (
                <View key={name} name={name} />
            ))}
        </ServerContentBlock>
    );
}
