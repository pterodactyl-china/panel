import { FolderOpen } from 'lucide-react';
import { cn, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Spinner } from '@/sdk';
import type { FileManagerEntry, ViewProps } from '@/sdk/theme';
import { FileRow, RowActionsProvider } from './FileRows';

const entryKey = ({ kind, name }: FileManagerEntry) => `${kind === 'directory' ? 'dir' : 'file'}_${name}`;

export default function FileManagerList({ model, className }: ViewProps<'server.files.manager.list'>) {
    if (model.loading) {
        return <Spinner size='large' centered />;
    }

    if (!model.entries.length) {
        return (
            <Empty className={cn('border', className)}>
                <EmptyHeader>
                    <EmptyMedia variant='icon'>
                        <FolderOpen />
                    </EmptyMedia>
                    <EmptyTitle>此文件夹为空</EmptyTitle>
                    <EmptyDescription>
                        {model.permissions.create ? '上传文件，或新建文件/文件夹以开始。' : '此文件夹中没有文件。'}
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const selected = new Set(model.selection);

    return (
        <div className={className}>
            {model.truncated && (
                <div className='rounded-sm bg-warning mb-px p-3'>
                    <p className='text-warning-foreground text-sm text-center'>
                        此目录过大，无法在浏览器中完整显示，仅展示前 250 个文件。
                    </p>
                </div>
            )}
            <RowActionsProvider model={model}>
                {model.entries.map((entry) => (
                    <FileRow key={entryKey(entry)} entry={entry} selected={selected.has(entry.name)} />
                ))}
            </RowActionsProvider>
        </div>
    );
}
