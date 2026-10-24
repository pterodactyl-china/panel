import { BookOpen, Code2, HeartHandshake, LifeBuoy } from 'lucide-react';
import { Link, type LinkProps } from '@tanstack/react-router';
import Icon from '@/components/elements/Icon';
import { useAdminVersion } from '@/api/admin/version/queries';
import type { AdminVersion } from '@/api/admin/version/queries';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import OverviewVersionCard from '@/components/admin/overview/OverviewVersionCard';
import Spinner from '@/components/elements/Spinner';
import { httpErrorToHuman } from '@/api/http';
import { ServerError } from '@/components/elements/ScreenBlock';
import Slot from '@/extensions/Slot';
import { interactiveSurfaceClass } from '@/components/ui/styles';
import { cn } from '@/lib/cn';

const sections: { to: LinkProps['to']; label: string; description: string }[] = [
    { to: '/panel/users', label: '用户', description: '创建、编辑与删除用户账户。' },
    { to: '/panel/locations', label: '地域', description: '将节点按物理地域分组。' },
    { to: '/panel/nodes', label: '节点', description: '管理 Wings 守护进程与分配。' },
    { to: '/panel/servers', label: '服务器', description: '创建并管理游戏服务器。' },
    { to: '/panel/databases', label: '数据库主机', description: '为服务器数据库配置 MySQL 主机。' },
    { to: '/panel/mounts', label: '挂载', description: '定义宿主机 → 容器挂载点。' },
    { to: '/panel/eggs', label: '预设', description: '管理服务器模板与变量。' },
    { to: '/panel/settings', label: '设置', description: '常规、邮件与高级配置。' },
    { to: '/panel/api', label: 'API 密钥', description: '签发应用 API 凭据。' },
];

const externalLinks = (version: AdminVersion) => [
    { href: version.discord, label: '获取帮助', icon: LifeBuoy },
    { href: 'https://pterodactyl.io', label: '文档', icon: BookOpen },
    { href: 'https://github.com/pterodactyl/panel', label: 'GitHub', icon: Code2 },
    { href: version.donations, label: '支持项目', icon: HeartHandshake },
];

export default function OverviewContainer() {
    const { data: version, error, refetch } = useAdminVersion();

    if (error && !version) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => refetch()} />;
    }

    return (
        <AdminContentBlock title='管理概览' heading='管理' description='管理您的用户、基础设施、服务器与面板设置。'>
            <Slot name='panel.overview.before' />
            {version ? (
                <>
                    <OverviewVersionCard version={version} />
                    <div className='mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                        {externalLinks(version).map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                target='_blank'
                                rel='noreferrer'
                                className={cn(
                                    'inline-flex items-center justify-center rounded-sm border border-border bg-card px-4 py-3 text-sm font-medium text-foreground no-underline hover:text-accent',
                                    interactiveSurfaceClass
                                )}
                            >
                                <Icon icon={link.icon} className='mr-2 h-4 w-4' />
                                {link.label}
                            </a>
                        ))}
                    </div>
                </>
            ) : (
                <Spinner size='large' centered />
            )}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {sections.map((s) => (
                    <Link
                        key={s.to}
                        to={s.to}
                        className={cn(
                            'block rounded-sm border border-transparent bg-card p-5 no-underline',
                            interactiveSurfaceClass
                        )}
                    >
                        <p className='text-foreground font-medium'>{s.label}</p>
                        <p className='text-muted-foreground text-sm mt-1'>{s.description}</p>
                    </Link>
                ))}
            </div>
            <Slot name='panel.overview.after' />
        </AdminContentBlock>
    );
}
