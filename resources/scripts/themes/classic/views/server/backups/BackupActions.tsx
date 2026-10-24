import { useState } from 'react';
import { CloudDownload, Lock, PackageOpen, Unlock } from 'lucide-react';
import {
    Checkbox,
    DeleteAction,
    Dialog,
    DropdownMenuItem,
    RowActions,
    RowActionsMenu,
    type BackupListModel,
    type BackupSummary,
} from '@/sdk';

type Confirming = '' | 'unlock' | 'restore' | 'delete';

/** A backup's delete action and its menu of download, restore and lock. */
export default function BackupActions({ model, backup }: { model: BackupListModel; backup: BackupSummary }) {
    const [confirming, setConfirming] = useState<Confirming>('');
    const [truncate, setTruncate] = useState(false);
    const { actions, pending, permissions } = model;
    const close = () => setConfirming('');
    const closeOnSuccess = (done: boolean) => {
        if (done) {
            close();
        }
    };

    const onLockToggle = () => {
        if (backup.locked && confirming !== 'unlock') {
            setConfirming('unlock');

            return;
        }

        void actions.toggleLock(backup.uuid).then(closeOnSuccess);
    };

    return (
        <>
            <Dialog.Confirm
                open={confirming === 'unlock'}
                onClose={close}
                title={`Unlock "${backup.name}"`}
                pending={pending.lock}
                onConfirmed={onLockToggle}
            >
                此备份将不再受保护，可能被自动或意外删除。
            </Dialog.Confirm>
            <Dialog.Confirm
                open={confirming === 'restore'}
                onClose={close}
                confirm='恢复'
                title={`Restore "${backup.name}"`}
                pending={pending.restore}
                onConfirmed={() => void actions.restore(backup.uuid, truncate).then(closeOnSuccess)}
            >
                <p>您的服务器将被停止。在操作完成前，您无法控制电源状态、访问文件管理器或创建新的备份。</p>
                <p className='mt-4 -mb-2 bg-card p-3 rounded-sm'>
                    <label htmlFor='restore_truncate' className='text-base flex items-center cursor-pointer'>
                        <Checkbox
                            className='mr-2 h-5 w-5 data-[checked]:border-destructive data-[checked]:bg-destructive data-[checked]:text-destructive-foreground'
                            id='restore_truncate'
                            value='true'
                            checked={truncate}
                            onChange={() => setTruncate((checked) => !checked)}
                        />
                        恢复备份前删除所有文件。
                    </label>
                </p>
            </Dialog.Confirm>
            <Dialog.Confirm
                title={`Delete "${backup.name}"`}
                confirm='继续'
                open={confirming === 'delete'}
                pending={pending.remove}
                onClose={close}
                onConfirmed={() => void actions.remove(backup.uuid).then(closeOnSuccess)}
            >
                这是不可撤销的操作。备份一旦删除将无法恢复。
            </Dialog.Confirm>
            <RowActions>
                {permissions.delete && (
                    <DeleteAction
                        aria-label={`删除 ${backup.name}`}
                        disabled={backup.locked}
                        disabledReason='删除前请先解锁此备份。'
                        onClick={() => setConfirming('delete')}
                    />
                )}
                {backup.successful && (
                    <RowActionsMenu label={`${backup.name} 的更多操作`}>
                        {permissions.download && (
                            <DropdownMenuItem onClick={() => void actions.download(backup.uuid)} icon={CloudDownload}>
                                下载
                            </DropdownMenuItem>
                        )}
                        {permissions.restore && (
                            <DropdownMenuItem onClick={() => setConfirming('restore')} icon={PackageOpen}>
                                恢复
                            </DropdownMenuItem>
                        )}
                        {permissions.delete && (
                            <DropdownMenuItem onClick={onLockToggle} icon={backup.locked ? Unlock : Lock}>
                                {backup.locked ? 'Unlock' : 'Lock'}
                            </DropdownMenuItem>
                        )}
                    </RowActionsMenu>
                )}
            </RowActions>
        </>
    );
}
