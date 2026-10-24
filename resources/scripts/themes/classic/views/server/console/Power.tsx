import { Button, Dialog } from '@/sdk';
import { Slot, type ViewProps } from '@/sdk/theme';

export default function Power({ model, className }: ViewProps<'server.power'>) {
    const { permissions, enabled, actions } = model;

    return (
        <div className={className}>
            <Slot name='server.console.power.before' data={model.server} />
            {(permissions.start || permissions.stop || permissions.restart) && (
                <div className='flex sm:justify-end space-x-2'>
                    {permissions.start && (
                        <Button className='flex-1' disabled={!enabled.start} onClick={actions.start}>
                            启动
                        </Button>
                    )}
                    {permissions.restart && (
                        <Button.Text className='flex-1' disabled={!enabled.restart} onClick={actions.restart}>
                            重启
                        </Button.Text>
                    )}
                    {permissions.stop &&
                        (model.killable ? (
                            <Dialog.ConfirmTrigger
                                key='killable'
                                hideCloseIcon
                                title='强制停止进程'
                                confirm='继续'
                                trigger={({ onClick }) => (
                                    <Button.Danger className='flex-1' disabled={!enabled.kill} onClick={onClick}>
                                        强制停止
                                    </Button.Danger>
                                )}
                                onConfirmed={(_event, close) => {
                                    close();
                                    actions.kill();
                                }}
                            >
                                强制停止服务器可能导致数据损坏。
                            </Dialog.ConfirmTrigger>
                        ) : (
                            <Button.Danger
                                key='stoppable'
                                className='flex-1'
                                disabled={!enabled.stop}
                                onClick={actions.stop}
                            >
                                停止
                            </Button.Danger>
                        ))}
                </div>
            )}
            <Slot name='server.console.power.after' data={model.server} />
        </div>
    );
}
