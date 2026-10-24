import { Button, Card, cn, Dialog } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function ServerReinstall({ model, className }: ViewProps<'server.reinstall'>) {
    if (!model.allowed) {
        return null;
    }

    return (
        <Card title='重装服务器' className={cn('relative', className)}>
            <p className='text-sm'>
                重装服务器将停止服务器，然后重新运行最初用于安装的脚本。&nbsp;
                <strong className='font-medium'>此过程中可能会删除或修改部分文件，请在继续前备份您的数据。</strong>
            </p>
            {model.unavailable && <p className='mt-3 text-sm text-muted-foreground'>{model.unavailable}</p>}
            <Dialog.ConfirmTrigger
                title='确认重装服务器'
                confirm='是，重装服务器'
                onConfirmed={async (_event, close) => {
                    if (await model.reinstall()) {
                        close();
                    }
                }}
                trigger={({ onClick }) => (
                    <div className='mt-6 text-right'>
                        <Button.Danger isSecondary disabled={model.unavailable !== null} onClick={onClick}>
                            重装服务器
                        </Button.Danger>
                    </div>
                )}
            >
                服务器将被停止，且此过程中可能会删除或修改部分文件。确定要继续吗？
            </Dialog.ConfirmTrigger>
        </Card>
    );
}
