import React from 'react';
import {
    type AdminServer,
    reinstallAdminServerInput,
    toggleAdminServerInstallStateInput,
    updateAdminServerSuspensionInput,
    useAdminServerTransferProgress,
    useReinstallAdminServer,
    useToggleAdminServerInstallState,
    useUpdateAdminServerSuspension,
} from '@/api/admin/servers/queries';
import { useAdminNodes } from '@/api/admin/nodes/queries';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import TransferServerModal from '@/components/admin/servers/TransferServerModal';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Button from '@/components/elements/Button';
import { Dialog } from '@/components/elements/dialog';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { Alert, type AlertType } from '@/components/elements/alert';
import { isObject } from '@/lib/objects';
import { canReinstallServer, SKIPPED_INSTALL_SCRIPT_MESSAGE } from '@/lib/serverStatus';

interface Props {
    server: AdminServer;
}

const descriptionClass = 'text-sm leading-relaxed text-card-foreground';
const actionButtonClass =
    'whitespace-nowrap disabled:border-border disabled:bg-popover disabled:text-muted-foreground disabled:opacity-100';

type CardAlert = { type: AlertType; title: string; message: string };

const ManageActionCard = ({
    title,
    alert,
    description,
    action,
}: {
    title: string;
    alert?: CardAlert;
    description: React.ReactNode;
    action: React.ReactNode;
}) => (
    <TitledGreyBox title={title} className='flex h-full flex-col' contentClassName='flex flex-1 flex-col p-0'>
        <div className='flex flex-1 flex-col gap-3 p-3'>
            {alert && (
                <Alert type={alert.type}>
                    <strong className='font-semibold'>{alert.title}</strong> {alert.message}
                </Alert>
            )}
            <p className={descriptionClass}>{description}</p>
        </div>
        <div className='flex items-center justify-end border-t border-border p-3'>{action}</div>
    </TitledGreyBox>
);

// The span is what receives the hover: a disabled button does not emit pointer events.
const ActionTrigger = ({ reason, children }: { reason?: string; children: React.ReactElement }) => (
    <Tooltip content={reason} disabled={!reason}>
        <span className='inline-flex'>{children}</span>
    </Tooltip>
);

const reinstallBlockedReasonFor = (attributes: AdminServer['attributes']): string | undefined => {
    if (attributes.container.installed !== 1) {
        return '服务器安装完成前此操作不可用。';
    }

    if (canReinstallServer(attributes.status, attributes.container.skip_scripts)) {
        return undefined;
    }

    return SKIPPED_INSTALL_SCRIPT_MESSAGE;
};

function ServerManageContent({ server }: Props) {
    const { attributes } = server;
    const reinstallServer = useReinstallAdminServer();
    const toggleInstallState = useToggleAdminServerInstallState();
    const updateSuspension = useUpdateAdminServerSuspension();
    const { data: transfer } = useAdminServerTransferProgress(attributes.id);
    const { data: nodes } = useAdminNodes({ page: 1 });

    const mutationOptions = (close: () => void) => ({ onSettled: close });

    const loading = reinstallServer.isPending || toggleInstallState.isPending || updateSuspension.isPending;
    const activeTransfer = isObject(transfer);
    const canTransfer = (nodes?.meta.pagination.total ?? 0) > 1;
    const reinstallBlockedReason = reinstallBlockedReasonFor(attributes);

    if (attributes.status === 'install_failed') {
        return (
            <TitledGreyBox title='无法管理服务器'>
                <p className={descriptionClass}>此服务器处于安装失败状态且无法恢复。请删除并重新创建服务器。</p>
            </TitledGreyBox>
        );
    }

    return (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <ManageActionCard
                title='重装服务器'
                alert={{ type: 'danger', title: '危险！', message: '这可能覆盖服务器数据。' }}
                description='这将使用已分配的服务脚本重装服务器。'
                action={
                    <Dialog.ConfirmTrigger
                        title='重装服务器'
                        confirm='Reinstall'
                        pending={reinstallServer.isPending}
                        trigger={({ onClick }) => (
                            <ActionTrigger reason={reinstallBlockedReason}>
                                <Button
                                    color='red'
                                    className={actionButtonClass}
                                    disabled={loading || reinstallBlockedReason !== undefined}
                                    onClick={onClick}
                                >
                                    重装服务器
                                </Button>
                            </ActionTrigger>
                        )}
                        onConfirmed={(_event, close) =>
                            reinstallServer.mutate(reinstallAdminServerInput(attributes.id), mutationOptions(close))
                        }
                    >
                        这将使用已分配的服务脚本重装服务器。 <strong>这可能覆盖服务器数据。</strong>
                    </Dialog.ConfirmTrigger>
                }
            />

            <ManageActionCard
                title='安装状态'
                description='如需在「未安装」与「已安装」状态之间切换，可使用下方按钮。'
                action={
                    <Dialog.ConfirmTrigger
                        title='切换安装状态'
                        confirm='Toggle'
                        pending={toggleInstallState.isPending}
                        trigger={({ onClick }) => (
                            <Button className={actionButtonClass} disabled={loading} onClick={onClick}>
                                切换安装状态
                            </Button>
                        )}
                        onConfirmed={(_event, close) =>
                            toggleInstallState.mutate(
                                toggleAdminServerInstallStateInput(attributes.id),
                                mutationOptions(close)
                            )
                        }
                    >
                        这将在「已安装」与「安装中」之间切换此服务器的安装状态。
                    </Dialog.ConfirmTrigger>
                }
            />

            {attributes.suspended ? (
                <ManageActionCard
                    title='解冻服务器'
                    description='这将解冻服务器并恢复用户的正常访问。'
                    action={
                        <Dialog.ConfirmTrigger
                            title='解冻服务器'
                            confirm='Unsuspend'
                            pending={updateSuspension.isPending}
                            trigger={({ onClick }) => (
                                <Button
                                    color='green'
                                    className={actionButtonClass}
                                    disabled={loading}
                                    onClick={onClick}
                                >
                                    解冻服务器
                                </Button>
                            )}
                            onConfirmed={(_event, close) =>
                                updateSuspension.mutate(
                                    updateAdminServerSuspensionInput(attributes.id, false),
                                    mutationOptions(close)
                                )
                            }
                        >
                            这将解冻服务器并恢复用户的正常访问。
                        </Dialog.ConfirmTrigger>
                    }
                />
            ) : (
                <ManageActionCard
                    title='冻结服务器'
                    description='这将冻结服务器、停止所有运行中的进程，并立即阻止用户访问其文件或管理服务器。'
                    action={
                        <Dialog.ConfirmTrigger
                            title='冻结服务器'
                            confirm='Suspend'
                            pending={updateSuspension.isPending}
                            trigger={({ onClick }) => (
                                <ActionTrigger reason={activeTransfer ? '此服务器正在转移，无法冻结。' : undefined}>
                                    <Button
                                        color='orange'
                                        className={actionButtonClass}
                                        disabled={loading || activeTransfer}
                                        onClick={onClick}
                                    >
                                        冻结服务器
                                    </Button>
                                </ActionTrigger>
                            )}
                            onConfirmed={(_event, close) =>
                                updateSuspension.mutate(
                                    updateAdminServerSuspensionInput(attributes.id, true),
                                    mutationOptions(close)
                                )
                            }
                        >
                            这将冻结服务器、停止所有运行中的进程，并阻止用户访问其文件或管理服务器。
                        </Dialog.ConfirmTrigger>
                    }
                />
            )}

            <ManageActionCard
                title='转移服务器'
                alert={
                    activeTransfer ? undefined : { type: 'warning', title: 'Warning!', message: '此功能可能存在缺陷。' }
                }
                description={
                    activeTransfer ? '此服务器正在转移到其他节点。' : '将此服务器转移到连接到本面板的其他节点。'
                }
                action={
                    <Dialog.Trigger
                        trigger={({ onClick }) => (
                            <ActionTrigger
                                reason={
                                    !activeTransfer && !canTransfer
                                        ? '转移服务器需要本面板至少配置两个节点。'
                                        : undefined
                                }
                            >
                                <Button
                                    color='green'
                                    className={actionButtonClass}
                                    disabled={loading || activeTransfer || !canTransfer}
                                    onClick={onClick}
                                >
                                    转移服务器
                                </Button>
                            </ActionTrigger>
                        )}
                    >
                        {({ open, onClose }) => <TransferServerModal server={server} open={open} onClose={onClose} />}
                    </Dialog.Trigger>
                }
            />
        </div>
    );
}

export default function ServerManageTab() {
    const { server } = useServerDetail();

    return <ServerManageContent server={server} />;
}
