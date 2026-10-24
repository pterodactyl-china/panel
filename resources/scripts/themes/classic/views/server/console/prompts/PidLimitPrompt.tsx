import { Dialog } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { Close, LimitIcon } from './parts';

export default function PidLimitPrompt({ model }: ViewProps<'server.feature.pidLimit'>) {
    return (
        <Dialog
            open={model.open}
            title={model.admin ? '已达到内存或进程上限' : '可能已达到资源上限'}
            onClose={model.close}
        >
            <LimitIcon />
            {model.admin ? (
                <>
                    <p className='mt-4'>此服务器已达到进程或内存上限。</p>
                    <p className='mt-4'>
                        提高 <code className='font-mono bg-muted'>container_pid_limit</code> 调整即可有助于解决此问题。
                    </p>
                    <p className='mt-4'>
                        <b>注意：配置文件的更改需要重启 Wings 才能生效</b>
                    </p>
                </>
            ) : (
                <>
                    <p className='mt-4'>此服务器正在尝试使用超出分配额度的资源。请联系管理员并提供下方的错误信息。</p>
                    <p className='mt-4'>
                        <code className='font-mono bg-muted'>
                            pthread_create 调用失败，可能是内存不足或已达进程/资源上限
                        </code>
                    </p>
                </>
            )}
            <Close onClick={model.close} />
        </Dialog>
    );
}
