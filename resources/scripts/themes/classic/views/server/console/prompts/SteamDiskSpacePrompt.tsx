import { Dialog } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { Close } from './parts';

export default function SteamDiskSpacePrompt({ model }: ViewProps<'server.feature.steamDiskSpace'>) {
    return (
        <Dialog open={model.open} title='可用磁盘空间不足' onClose={model.close}>
            {model.admin ? (
                <>
                    <p className='mt-4'>此服务器可用磁盘空间已耗尽，无法完成安装或更新过程。</p>
                    <p className='mt-4'>
                        请在托管此服务器的机器上执行{' '}
                        <code className='font-mono bg-muted rounded-sm py-1 px-2'>df -h</code>{' '}
                        查看磁盘空间，删除文件或扩大可用空间以解决问题。
                    </p>
                </>
            ) : (
                <p className='mt-4'>此服务器可用磁盘空间已耗尽，无法完成安装或更新。请联系管理员并告知磁盘空间问题。</p>
            )}
            <Close onClick={model.close} />
        </Dialog>
    );
}
