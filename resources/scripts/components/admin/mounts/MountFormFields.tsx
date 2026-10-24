import type { AppForm } from '@/components/form';
import type { MountValues } from '@/api/admin/mounts/queries';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { validateMountName } from '@/components/admin/mounts/mountForm';

interface Props {
    form: AppForm<MountValues>;
}

const DetailsFields = ({ form }: Props) => (
    <div className='space-y-6'>
        <form.AppField
            name='name'
            validators={{
                onChange: ({ value }) => validateMountName(value),
            }}
        >
            {(field) => <field.TextField type='text' id='name' label='名称' description='用于标识此挂载的唯一名称。' />}
        </form.AppField>
        <form.AppField
            name='description'
            validators={{
                onChange: ({ value }) => (value.length <= 191 ? undefined : '描述不得超过 191 个字符。'),
            }}
        >
            {(field) => <field.TextField type='text' id='description' label='描述' description='此挂载的详细描述。' />}
        </form.AppField>
    </div>
);

const PathFields = ({ form }: Props) => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <form.AppField
            name='source'
            validators={{
                onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供源路径。'),
            }}
        >
            {(field) => (
                <field.TextField type='text' id='source' label='源路径' description='宿主机上要挂载到容器中的路径。' />
            )}
        </form.AppField>
        <form.AppField
            name='target'
            validators={{
                onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供目标路径。'),
            }}
        >
            {(field) => (
                <field.TextField
                    type='text'
                    id='target'
                    label='目标路径'
                    description='源路径在容器内挂载的目标路径。'
                />
            )}
        </form.AppField>
    </div>
);

const AccessFields = ({ form }: Props) => (
    <div className='space-y-6'>
        <form.AppField name='readOnly'>
            {(field) => <field.SwitchField label='只读' description='在容器内以只读方式挂载此卷。' />}
        </form.AppField>
        <form.AppField name='userMountable'>
            {(field) => <field.SwitchField label='用户可挂载' description='允许用户将此挂载添加到服务器。' />}
        </form.AppField>
    </div>
);

export default function MountFormFields({ form }: Props) {
    return (
        <div className='space-y-6'>
            <TitledGreyBox title='挂载详情'>
                <DetailsFields form={form} />
            </TitledGreyBox>
            <TitledGreyBox title='路径'>
                <PathFields form={form} />
            </TitledGreyBox>
            <TitledGreyBox title='访问'>
                <AccessFields form={form} />
            </TitledGreyBox>
        </div>
    );
}
