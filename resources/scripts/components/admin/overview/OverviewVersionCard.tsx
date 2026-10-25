import type { AdminVersion } from '@/api/admin/version/queries';
import { Alert } from '@/components/elements/alert';

export default function OverviewVersionCard({ version }: { version: AdminVersion }) {
    return (
        <Alert
            type={version.is_latest ? 'success' : 'warning'}
            title={version.is_latest ? '面板已是最新版本。' : '面板有可用更新。'}
            className='mb-6'
        >
            {version.is_latest ? (
                <>
                    您正在运行版本 <code className='font-mono'>{version.current}</code>。
                </>
            ) : (
                <>
                    您正在运行版本 <code className='font-mono'>{version.current}</code>；最新可用版本为{' '}
                    <a
                        href={`https://github.com/pterodactyl-china/panel/releases/tag/v${version.latest}`}
                        target='_blank'
                        rel='noreferrer'
                        className='font-mono underline transition-colors hover:text-accent'
                    >
                        {version.latest}
                    </a>
                    . Follow the{' '}
                    <a
                        href='https://docs.pterodactyl.top/v2/panel/updating'
                        target='_blank'
                        rel='noreferrer'
                        className='underline transition-colors hover:text-accent'
                    >
                        update guide
                    </a>{' '}
                    to upgrade.
                </>
            )}
        </Alert>
    );
}
