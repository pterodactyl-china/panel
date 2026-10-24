import { useAppForm, Form } from '@/components/form';
import type { AdminEggVariable } from '@/api/admin/eggs/queries';
import {
    deleteAdminEggVariableInput,
    updateAdminEggVariableInput,
    useDeleteAdminEggVariable,
    useUpdateAdminEggVariable,
} from '@/api/admin/eggs/queries';
import {
    eggVariableBodyFromFormValues,
    type EggVariableValues,
    validateEnvVariable,
    validateVariableName,
} from '@/components/admin/eggs/helpers';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Button from '@/components/elements/Button';
import Code from '@/components/elements/Code';
import { Dialog } from '@/components/elements/dialog';

interface Props {
    eggId: number;
    variable: AdminEggVariable;
}

const variableToFormValues = (variable: AdminEggVariable): EggVariableValues => ({
    name: variable.attributes.name,
    description: variable.attributes.description,
    envVariable: variable.attributes.env_variable,
    defaultValue: variable.attributes.default_value,
    userViewable: variable.attributes.user_viewable,
    userEditable: variable.attributes.user_editable,
    rules: variable.attributes.rules,
});

export default function EggVariableBox({ eggId, variable }: Props) {
    const updateEggVariable = useUpdateAdminEggVariable();
    const deleteEggVariable = useDeleteAdminEggVariable();

    const form = useAppForm({
        defaultValues: variableToFormValues(variable),
        onSubmit: async ({ value }) => {
            try {
                await updateEggVariable.mutateAsync(
                    updateAdminEggVariableInput(eggId, variable.attributes.id, eggVariableBodyFromFormValues(value))
                );
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const confirmDelete = async () => {
        try {
            await deleteEggVariable.mutateAsync(
                deleteAdminEggVariableInput(eggId, variable.attributes.id, variable.attributes.name)
            );
        } catch {
            // Error toast is handled by the mutation.
        }
    };

    return (
        <Form form={form}>
            <TitledGreyBox title={variable.attributes.name}>
                <form.AppField
                    name='name'
                    validators={{
                        onChange: ({ value }) => validateVariableName(value),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id={`name_${variable.attributes.id}`}
                            label='名称'
                            description='此变量的易读名称。'
                        />
                    )}
                </form.AppField>
                <div className='mt-4'>
                    <form.AppField name='description'>
                        {(field) => (
                            <field.TextAreaField id={`description_${variable.attributes.id}`} label='描述' rows={3} />
                        )}
                    </form.AppField>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                    <form.AppField
                        name='envVariable'
                        validators={{
                            onChange: ({ value }) => validateEnvVariable(value),
                        }}
                    >
                        {(field) => (
                            <field.TextField type='text' id={`env_${variable.attributes.id}`} label='环境变量' />
                        )}
                    </form.AppField>
                    <form.AppField name='defaultValue'>
                        {(field) => (
                            <field.TextField type='text' id={`default_${variable.attributes.id}`} label='默认值' />
                        )}
                    </form.AppField>
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                    在启动命令中通过以下方式引用此变量： <Code>{variable.attributes.env_variable}</Code>.
                </p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                    <form.AppField name='userViewable'>
                        {(field) => <field.SwitchField label='用户可查看' />}
                    </form.AppField>
                    <form.AppField name='userEditable'>
                        {(field) => <field.SwitchField label='用户可编辑' />}
                    </form.AppField>
                </div>
                <div className='mt-4'>
                    <form.AppField
                        name='rules'
                        validators={{
                            onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供验证规则。'),
                        }}
                    >
                        {(field) => (
                            <field.TextField
                                type='text'
                                id={`rules_${variable.attributes.id}`}
                                label='输入规则'
                                description='用于验证此变量的标准 Laravel 验证规则。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='flex items-center justify-between mt-6'>
                    <Dialog.ConfirmTrigger
                        title={`删除 ${variable.attributes.name}`}
                        confirm='删除变量'
                        onConfirmed={confirmDelete}
                        trigger={({ onClick }) => (
                            <Button type='button' color='red' isSecondary onClick={onClick}>
                                删除
                            </Button>
                        )}
                    >
                        这将从该预设中永久移除变量 <strong>{variable.attributes.name}</strong>。
                    </Dialog.ConfirmTrigger>
                    <form.AppForm>
                        <form.SubmitButton>保存</form.SubmitButton>
                    </form.AppForm>
                </div>
            </TitledGreyBox>
        </Form>
    );
}
