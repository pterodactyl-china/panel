import { Badge, Button, cn, Dialog, formatDate, Spinner, SpinnerOverlay, type ScheduleSummary } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import NewTaskButton from './NewTaskButton';
import ScheduleCronRow from './ScheduleCronRow';
import ScheduleDialog from './ScheduleDialog';

const CronBox = ({ title, value }: { title: string; value: string }) => (
    <div className='bg-card rounded-sm p-3'>
        <p className='text-muted-foreground text-sm'>{title}</p>
        <p className='text-xl font-medium text-foreground'>{value}</p>
    </div>
);

function StatusBadge({ schedule }: { schedule: ScheduleSummary }) {
    if (schedule.processing) {
        return (
            <Badge className='ml-4 flex items-center rounded-full py-px uppercase'>
                <Spinner />
                处理中
            </Badge>
        );
    }

    return (
        <Badge
            tone={schedule.active ? 'success' : 'danger'}
            className={cn('ml-4 rounded-full py-px uppercase', schedule.active ? 'bg-success/90' : 'bg-destructive/90')}
        >
            {schedule.active ? 'Active' : 'Inactive'}
        </Badge>
    );
}

const RunTime = ({ at }: { at: string | null }) =>
    at ? formatDate(at, 'YYYY-MM-DD HH:mm') : <span className='text-muted-foreground'>n/a</span>;

/** The schedule's header, cron and actions; `children` (its tasks) render inside the box below the cron. */
export default function ScheduleDetails({ model, className, children }: ViewProps<'server.schedule'>) {
    const { schedule, actions } = model;

    return (
        <div className={className}>
            <ScheduleCronRow cron={schedule.cron} className='sm:hidden bg-card rounded-sm mb-4 p-3' />
            <div className='rounded-sm shadow-sm'>
                <div className='sm:flex items-center bg-muted p-3 sm:p-6 border-b-4 border-border rounded-t-sm'>
                    <div className='flex-1'>
                        <h3 className='flex items-center text-foreground text-2xl'>
                            {schedule.name}
                            <StatusBadge schedule={schedule} />
                        </h3>
                        <p className='mt-1 text-sm text-foreground'>
                            上次运行：&nbsp;
                            <RunTime at={schedule.lastRunAt} />
                            <span className='ml-4 pl-4 border-l-4 border-border py-px'>
                                下次运行：&nbsp;
                                <RunTime at={schedule.nextRunAt} />
                            </span>
                        </p>
                    </div>
                    <div className='flex sm:block mt-3 sm:mt-0'>
                        {model.canUpdate && (
                            <>
                                <Dialog.Trigger
                                    trigger={({ onClick }) => (
                                        <Button.Text className='flex-1 mr-4' onClick={onClick}>
                                            编辑
                                        </Button.Text>
                                    )}
                                >
                                    {(dialog) => (
                                        <ScheduleDialog
                                            {...dialog}
                                            values={model.values}
                                            editing
                                            onSubmit={actions.update}
                                        />
                                    )}
                                </Dialog.Trigger>
                                <NewTaskButton form={model.taskForm} onSubmit={actions.createTask} className='flex-1' />
                            </>
                        )}
                    </div>
                </div>
                <div className='hidden sm:grid grid-cols-5 md:grid-cols-5 gap-4 mb-4 mt-4'>
                    <CronBox title='分钟' value={schedule.cron.minute} />
                    <CronBox title='小时' value={schedule.cron.hour} />
                    <CronBox title='日（月）' value={schedule.cron.dayOfMonth} />
                    <CronBox title='月' value={schedule.cron.month} />
                    <CronBox title='星期（周）' value={schedule.cron.dayOfWeek} />
                </div>
                {children}
            </div>
            <div className='mt-6 flex sm:justify-end'>
                {model.canDelete && (
                    <Dialog.ConfirmTrigger
                        title='删除计划'
                        confirm='删除'
                        onConfirmed={async (_event, close) => {
                            await actions.remove();
                            close();
                        }}
                        trigger={({ onClick }) => (
                            <Button.Danger
                                isSecondary
                                className='flex-1 sm:flex-none mr-4 border-transparent'
                                onClick={onClick}
                            >
                                删除
                            </Button.Danger>
                        )}
                    >
                        <SpinnerOverlay visible={model.deleting} />
                        所有任务将被移除，任何运行中的进程将被终止。
                    </Dialog.ConfirmTrigger>
                )}
                {model.taskCount > 0 && model.canUpdate && (
                    <>
                        <SpinnerOverlay visible={model.running} size='large' />
                        <Button
                            isSecondary
                            className='flex-1 sm:flex-none'
                            disabled={schedule.processing || model.running}
                            onClick={() => void actions.run()}
                        >
                            立即运行
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
