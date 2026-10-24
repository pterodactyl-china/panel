import { useState } from 'react';
import {
    Dialog,
    Form,
    useAppForm,
    type ScheduleTask,
    type ScheduleTaskAction,
    type ScheduleTaskForm,
    type ScheduleTaskValues,
} from '@/sdk';

interface Props {
    open: boolean;
    onClose: () => void;
    form: ScheduleTaskForm;
    /** The task to edit; a new task when left out. */
    task?: ScheduleTask;
    onSubmit: (values: ScheduleTaskValues) => Promise<boolean>;
}

function TaskForm({ form: config, task, onSubmit, onClose }: Omit<Props, 'open'>) {
    const [formError, setFormError] = useState<string | null>(null);
    const form = useAppForm({
        defaultValues: { ...config.values(task) },
        onSubmit: async ({ value }) => {
            setFormError(null);

            const error = config.validate(value);

            if (error) {
                setFormError(error);

                return;
            }

            if (value.timeOffset !== null && (await onSubmit(value))) {
                onClose();
            }
        },
    });
    const payloadValidators = {
        onChangeListenTo: ['action' as const],
        onChange: ({ value }: { value: string }) => config.validatePayload(form.getFieldValue('action'), value),
    };

    return (
        <Form form={form} className='m-0'>
            {formError && (
                <div className='rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground mb-4'>
                    {formError}
                </div>
            )}
            <div className='flex'>
                <div className='mr-2 w-1/3'>
                    <form.AppField name='action'>
                        {(field) => (
                            <field.SelectField
                                label='操作'
                                options={[...config.actions]}
                                onChange={(value) =>
                                    form.setFieldValue('payload', config.payloadFor(value as ScheduleTaskAction, task))
                                }
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='flex-1 ml-6'>
                    <form.AppField
                        name='timeOffset'
                        validators={{ onChange: ({ value }) => config.validateTimeOffset(value) }}
                    >
                        {(field) => (
                            <field.NumberField
                                label='时间偏移（秒）'
                                min={0}
                                max={900}
                                description='上一个任务执行后等待多久再运行此任务。如果这是计划中的第一个任务，则不会应用此设置。'
                            />
                        )}
                    </form.AppField>
                </div>
            </div>
            <div className='mt-6'>
                <form.Subscribe selector={(state) => state.values.action}>
                    {(action) => (
                        <>
                            {action === 'command' && (
                                <form.AppField name='payload' validators={payloadValidators}>
                                    {(field) => <field.TextAreaField label='载荷' rows={6} />}
                                </form.AppField>
                            )}
                            {action === 'power' && (
                                <form.AppField name='payload' validators={payloadValidators}>
                                    {(field) => <field.SelectField label='载荷' options={[...config.powerSignals]} />}
                                </form.AppField>
                            )}
                            {action === 'backup' && (
                                <form.AppField name='payload' validators={payloadValidators}>
                                    {(field) => (
                                        <field.TextAreaField
                                            label='忽略的文件'
                                            rows={6}
                                            description='可选。填写此备份要排除的文件和文件夹，默认使用 .pteroignore 的内容。达到备份上限时最旧的备份会被轮换。'
                                        />
                                    )}
                                </form.AppField>
                            )}
                        </>
                    )}
                </form.Subscribe>
            </div>
            <div className='mt-6 bg-card border border-border shadow-inner p-4 rounded-sm'>
                <form.AppField name='continueOnFailure'>
                    {(field) => <field.SwitchField description='此任务失败时将继续运行后续任务。' label='失败后继续' />}
                </form.AppField>
            </div>
            <div className='flex justify-end mt-6'>
                <form.AppForm>
                    <form.SubmitButton>{task ? '保存更改' : '创建任务'}</form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    );
}

/** Creates a task, or edits one: its action, delay, payload and failure behaviour. */
export default function TaskDialog({ open, onClose, ...props }: Props) {
    return (
        <Dialog open={open} title={props.task ? '编辑任务' : '创建任务'} onClose={onClose}>
            <TaskForm key={props.task?.id ?? 'new'} {...props} onClose={onClose} />
        </Dialog>
    );
}
