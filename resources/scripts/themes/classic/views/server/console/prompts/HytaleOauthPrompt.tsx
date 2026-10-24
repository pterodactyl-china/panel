import { Button, Dialog } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { cancelClass } from './parts';

export default function HytaleOauthPrompt({ model }: ViewProps<'server.feature.hytaleOauth'>) {
    return (
        <Dialog open={model.open} title='需要身份验证' onClose={model.close}>
            <p className='text-foreground'>
                您需要使用 Hytale 账户进行身份验证才能下载或更新服务器文件。请登录后继续。
            </p>
            <div className='mt-8 sm:flex items-center justify-end'>
                <Button isSecondary onClick={model.close} className={cancelClass}>
                    取消
                </Button>
                <Button onClick={model.login} disabled={!model.link} className='mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto'>
                    登录
                </Button>
            </div>
        </Dialog>
    );
}
