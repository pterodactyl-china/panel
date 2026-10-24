import { useState } from 'react';
import { Dialog, Form, Switch, useAppForm, type ScheduleFormValues } from '@/sdk';
import ScheduleCheatsheet from './ScheduleCheatsheet';

interface Props {
    open: boolean;
    onClose: () => void;
    /** The values the form starts from. */
    values: ScheduleFormValues;
    /** The form edits an existing schedule rather than creating one. */
    editing: boolean;
    onSubmit: (values: ScheduleFormValues) => Promise<boolean>;
}

const cronFieldsClass = [
    'mt-6 grid grid-cols-2 items-end gap-4 sm:grid-cols-5',
    '[&_label]:text-xs [&_label]:text-muted-foreground',
    '[&_input]:text-center [&_input]:font-mono',
].join(' ');

function ScheduleForm({ values, editing, onSubmit, onClose }: Omit<Props, 'open'>) {
    const [showCheatsheet, setShowCheatsheet] = useState(false);
    const form = useAppForm({
        defaultValues: { ...values },
        onSubmit: async ({ value }) => {
            if (await onSubmit(value)) {
                onClose();
            }
        },
    });

    return (
        <Form form={form}>
            <form.AppField name='name'>
                {(field) => <field.TextField label='计划名称' description='此计划的可读标识。' />}
            </form.AppField>
            <div className={cronFieldsClass}>
                <form.AppField name='minute'>{(field) => <field.TextField label='分钟' />}</form.AppField>
                <form.AppField name='hour'>{(field) => <field.TextField label='小时' />}</form.AppField>
                <form.AppField name='dayOfMonth'>{(field) => <field.TextField label='每月第几日' />}</form.AppField>
                <form.AppField name='month'>{(field) => <field.TextField label='月' />}</form.AppField>
                <form.AppField name='dayOfWeek'>{(field) => <field.TextField label='每周星期几' />}</form.AppField>
            </div>
            <p className='text-muted-foreground text-xs mt-2'>
                计划系统支持使用 Cron 表达式定义任务的执行时间。请使用上方的字段指定这些任务的运行时间。
            </p>
            <div className='mt-6 bg-card border border-border shadow-inner p-4 rounded-sm'>
                <Switch
                    label='显示速查表'
                    description='查看 cron 备忘单以了解示例。'
                    checked={showCheatsheet}
                    onChange={() => setShowCheatsheet((shown) => !shown)}
                />
                {showCheatsheet && <ScheduleCheatsheet />}
            </div>
            <div className='mt-6 bg-card border border-border shadow-inner p-4 rounded-sm'>
                <form.AppField name='onlyWhenOnline'>
                    {(field) => (
                        <field.SwitchField
                            description='仅在服务器处于运行状态时执行此计划。'
                            label='仅当服务器在线时'
                        />
                    )}
                </form.AppField>
            </div>
            <div className='mt-6 bg-card border border-border shadow-inner p-4 rounded-sm'>
                <form.AppField name='enabled'>
                    {(field) => <field.SwitchField description='启用后此计划将自动执行。' label='计划已启用' />}
                </form.AppField>
            </div>
            <div className='mt-6 text-right'>
                <form.AppForm>
                    <form.SubmitButton className='w-full sm:w-auto'>
                        {editing ? '保存更改' : '创建计划'}
                    </form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    );
}

/** Creates a schedule, or edits one, with its name, cron fields and switches. */
export default function ScheduleDialog({ open, onClose, ...props }: Props) {
    return (
        <Dialog open={open} title={props.editing ? '编辑计划' : '创建计划'} onClose={onClose}>
            <ScheduleForm {...props} onClose={onClose} />
        </Dialog>
    );
}
