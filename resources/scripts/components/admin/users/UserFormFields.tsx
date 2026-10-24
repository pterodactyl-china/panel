import type { UserValues } from '@/api/admin/users/queries';
import type { AppForm } from '@/components/form';
import type { SelectOption } from '@/components/ui/Select';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import {
    validateFirstName,
    validateLastName,
    validateUserEmail,
    validateUsername,
    validateUserPassword,
} from '@/components/admin/users/userForm';

interface Props {
    form: AppForm<UserValues>;
    languageOptions: SelectOption[];
    languagesLoading: boolean;
}

const AccountFields = ({ form }: Pick<Props, 'form'>) => (
    <div className='space-y-6'>
        <form.AppField name='email' validators={{ onChange: validateUserEmail }}>
            {(field) => (
                <field.TextField
                    type='email'
                    id='email'
                    label='电子邮箱地址'
                    description='此用户用于登录和接收通知的电子邮箱地址。'
                />
            )}
        </form.AppField>
        <form.AppField name='username' validators={{ onChange: validateUsername }}>
            {(field) => (
                <field.TextField type='text' id='username' label='用户名' description='用于标识此账户的唯一用户名。' />
            )}
        </form.AppField>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <form.AppField name='nameFirst' validators={{ onChange: validateFirstName }}>
                {(field) => <field.TextField type='text' id='name_first' label='名字' />}
            </form.AppField>
            <form.AppField name='nameLast' validators={{ onChange: validateLastName }}>
                {(field) => <field.TextField type='text' id='name_last' label='姓氏' />}
            </form.AppField>
        </div>
    </div>
);

const AuthenticationFields = ({ form, languageOptions, languagesLoading }: Props) => (
    <div className='space-y-6'>
        <form.AppField name='password' validators={{ onChange: validateUserPassword }}>
            {(field) => (
                <field.TextField
                    type='password'
                    id='password'
                    label='密码'
                    description='留空则向该用户发送设置链接，由其自行设置。'
                    autoComplete='new-password'
                />
            )}
        </form.AppField>
        <form.AppField
            name='language'
            validators={{
                onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供语言。'),
            }}
        >
            {(field) => (
                <field.SelectField
                    id='language'
                    label='语言'
                    options={languageOptions}
                    disabled={languagesLoading}
                    placeholder='选择语言'
                    description='此账户的默认语言。'
                />
            )}
        </form.AppField>
    </div>
);

const AccessFields = ({ form }: Pick<Props, 'form'>) => (
    <form.AppField name='rootAdmin'>
        {(field) => <field.SwitchField label='管理员' description='授予此账户对面板的完整管理权限。' />}
    </form.AppField>
);

export default function UserFormFields({ form, languageOptions, languagesLoading }: Props) {
    return (
        <div className='space-y-6'>
            <TitledGreyBox title='账户详情'>
                <AccountFields form={form} />
            </TitledGreyBox>
            <TitledGreyBox title='认证'>
                <AuthenticationFields
                    form={form}
                    languageOptions={languageOptions}
                    languagesLoading={languagesLoading}
                />
            </TitledGreyBox>
            <TitledGreyBox title='访问'>
                <AccessFields form={form} />
            </TitledGreyBox>
        </div>
    );
}
