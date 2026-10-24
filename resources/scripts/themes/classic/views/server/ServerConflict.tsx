import { ScreenBlock, screenImages } from '@/sdk';
import type { ServerConflict as Conflict, ViewProps } from '@/sdk/theme';

const notices = {
    installing: {
        title: '正在运行安装程序',
        image: screenImages.installing,
        message: '您的服务器即将准备就绪，请几分钟后重试。',
    },
    suspended: {
        title: '服务器已冻结',
        image: screenImages.error,
        message: '此服务器已被冻结，无法访问。',
    },
    maintenance: {
        title: '节点维护中',
        image: screenImages.error,
        message: '此服务器所在节点正在维护中。',
    },
    transferring: {
        title: '传输中',
        image: screenImages.restoring,
        message: '您的服务器正在转移到新节点，请稍后再查看。',
    },
    'restoring-backup': {
        title: '正在从备份恢复',
        image: screenImages.restoring,
        message: '您的服务器正在从备份恢复，请几分钟后再查看。',
    },
} satisfies Record<Conflict, { title: string; image: string; message: string }>;

export default function ServerConflict({ model, className }: ViewProps<'server.conflict'>) {
    if (!model.kind) {
        return null;
    }

    const { title, image, message } = notices[model.kind];

    return <ScreenBlock title={title} image={image} message={message} className={className} />;
}
