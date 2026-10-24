import { Dialog, Form, NewButton, SpinnerOverlay, useAppForm, type BackupListModel } from '@/sdk';

const ignoredDescription = [
    '请输入生成此备份时要忽略的文件或文件夹。',
    '留空则使用服务器根目录下 .pteroignore 文件的内容（如存在）。',
    '除支持通过路径前缀取反规则外，也支持对文件和文件夹使用通配符匹配。',
    'with an exclamation point.',
].join(' ');

function CreateBackupDialog({ model, onClose }: { model: BackupListModel; onClose: () => void }) {
    const form = useAppForm({
        defaultValues: { name: '', ignored: '', isLocked: false },
        onSubmit: async ({ value }) => {
            if (await model.actions.create(value)) {
                onClose();
            }
        },
    });

    return (
        <form.Subscribe selector={(state) => state.isSubmitting}>
            {(submitting) => (
                <Dialog
                    open
                    title='创建服务器备份'
                    onClose={onClose}
                    preventExternalClose={submitting}
                    hideCloseIcon={submitting}
                >
                    <SpinnerOverlay visible={submitting} />
                    <Form form={form}>
                        <form.AppField name='name' validators={{ onChange: ({ value }) => model.validateName(value) }}>
                            {(field) => (
                                <field.TextField label='备份名称' description='如填写，将作为引用此备份的名称。' />
                            )}
                        </form.AppField>
                        <div className='mt-6'>
                            <form.AppField name='ignored'>
                                {(field) => (
                                    <field.TextAreaField
                                        label='忽略的文件与目录'
                                        rows={6}
                                        description={ignoredDescription}
                                    />
                                )}
                            </form.AppField>
                        </div>
                        {model.permissions.delete && (
                            <div className='mt-6 bg-card border border-border shadow-inner p-4 rounded-sm'>
                                <form.AppField name='isLocked'>
                                    {(field) => (
                                        <field.SwitchField
                                            label='已锁定'
                                            description='在显式解锁之前，阻止删除此备份。'
                                        />
                                    )}
                                </form.AppField>
                            </div>
                        )}
                        <div className='flex justify-end mt-6'>
                            <form.AppForm>
                                <form.SubmitButton>开始备份</form.SubmitButton>
                            </form.AppForm>
                        </div>
                    </Form>
                </Dialog>
            )}
        </form.Subscribe>
    );
}

export default function CreateBackupButton({ model }: { model: BackupListModel }) {
    return (
        <Dialog.Trigger trigger={({ onClick }) => <NewButton onClick={onClick}>新建备份</NewButton>}>
            {({ open, onClose }) => open && <CreateBackupDialog model={model} onClose={onClose} />}
        </Dialog.Trigger>
    );
}
