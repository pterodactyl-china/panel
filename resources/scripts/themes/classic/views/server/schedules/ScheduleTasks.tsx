import { useMemo } from 'react';
import { ArrowDownCircle, Clock, Code, FileArchive, ListTodo, ToggleRight, type LucideIcon } from 'lucide-react';
import {
    actionsColumn,
    Badge,
    DeleteAction,
    Dialog,
    EditAction,
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    Icon,
    RowActions,
    SpinnerOverlay,
    Table,
    type ScheduleTask,
    type ScheduleTasksModel,
    type TableColumn,
} from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import NewTaskButton from './NewTaskButton';
import TaskDialog from './TaskDialog';

const actionDetails = (action: string): [string, LucideIcon] => {
    switch (action) {
        case 'command':
            return ['发送命令', Code];
        case 'power':
            return ['发送电源操作', ToggleRight];
        case 'backup':
            return ['创建备份', FileArchive];
        default:
            return ['未知操作', Code];
    }
};

function TaskIdentity({ task }: { task: ScheduleTask }) {
    const [title, icon] = actionDetails(task.action);

    return (
        <div className='flex min-w-48 items-start gap-3'>
            <Icon icon={icon} className='mt-0.5 hidden text-muted-foreground md:block' />
            <div className='min-w-0'>
                <p className='font-medium'>{title}</p>
                {task.payload ? (
                    <code className='mt-1 block max-w-xl whitespace-pre-wrap break-all text-xs text-muted-foreground'>
                        {task.payload}
                    </code>
                ) : null}
            </div>
        </div>
    );
}

function TaskActions({ model, task }: { model: ScheduleTasksModel; task: ScheduleTask }) {
    const name = `任务 ${task.sequence}（${actionDetails(task.action)[0]}）`;

    return (
        <RowActions>
            {model.canUpdate && (
                <>
                    <Dialog.Trigger
                        trigger={({ onClick }) => <EditAction aria-label={`编辑 ${name}`} onClick={onClick} />}
                    >
                        {(dialog) => (
                            <TaskDialog
                                {...dialog}
                                form={model.form}
                                task={task}
                                onSubmit={(values) => model.actions.update(task.id, values)}
                            />
                        )}
                    </Dialog.Trigger>
                    <Dialog.ConfirmTrigger
                        title='确认删除任务'
                        confirm='删除任务'
                        onConfirmed={async (_event, close) => {
                            if (await model.actions.remove(task.id)) {
                                close();
                            }
                        }}
                        trigger={({ onClick }) => <DeleteAction aria-label={`删除 ${name}`} onClick={onClick} />}
                    >
                        确定要删除此任务吗？此操作无法撤销。
                    </Dialog.ConfirmTrigger>
                </>
            )}
        </RowActions>
    );
}

function columns(model: ScheduleTasksModel): TableColumn<ScheduleTask>[] {
    return [
        {
            id: 'action',
            label: '任务',
            sortValue: (task) => actionDetails(task.action)[0],
            cell: (task) => <TaskIdentity task={task} />,
        },
        {
            id: 'delay',
            label: '延迟',
            sortValue: (task) => task.timeOffset,
            cell: (task) =>
                task.sequence > 1 && task.timeOffset > 0 ? (
                    <span className='inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground'>
                        <Icon icon={Clock} className='h-3.5 w-3.5' />
                        {task.timeOffset}s later
                    </span>
                ) : (
                    '-'
                ),
            headerClassName: 'hidden md:table-cell w-32',
            cellClassName: 'hidden md:table-cell w-32',
        },
        {
            id: 'continue_on_failure',
            label: '失败处理',
            cell: (task) =>
                task.continueOnFailure ? (
                    <Badge tone='warning' className='inline-flex items-center gap-1.5 whitespace-nowrap rounded-full'>
                        <Icon icon={ArrowDownCircle} className='h-3.5 w-3.5' />
                        继续
                    </Badge>
                ) : (
                    <span className='text-xs text-muted-foreground'>停止</span>
                ),
            headerClassName: 'hidden lg:table-cell w-36',
            cellClassName: 'hidden lg:table-cell w-36',
        },
        actionsColumn(2, (task) => <TaskActions model={model} task={task} />),
    ];
}

export default function ScheduleTasks({ model, className }: ViewProps<'server.schedule.tasks'>) {
    const tableColumns = useMemo(() => columns(model), [model]);

    return (
        <>
            <SpinnerOverlay visible={model.deleting} fixed size='large' />
            <Table
                rows={model.tasks}
                columns={tableColumns}
                keyOf={(task) => String(task.id)}
                className={className}
                emptyState={
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <ListTodo />
                            </EmptyMedia>
                            <EmptyTitle>没有任务</EmptyTitle>
                            <EmptyDescription>添加任务以指定此计划运行时要执行的操作。</EmptyDescription>
                        </EmptyHeader>
                        {model.canUpdate && (
                            <EmptyContent>
                                <NewTaskButton form={model.form} onSubmit={model.actions.create} />
                            </EmptyContent>
                        )}
                    </Empty>
                }
            />
        </>
    );
}
