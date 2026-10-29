import { useMemo } from 'react';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Server } from 'lucide-react';
import type { AppForm } from '@/components/form';
import { useAppForm, Form } from '@/components/form';
import { httpErrorToHuman } from '@/api/http';
import type { UserValues } from '@/api/admin/users/queries';
import { useAdminLanguages } from '@/api/admin/languages/queries';
import {
    type AdminUserWithServers,
    type AdminUserServer,
    deleteAdminUserInput,
    updateAdminUserInput,
    useAdminUserWithServers,
    useDeleteAdminUser,
    useUpdateAdminUser,
} from '@/api/admin/users/queries';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import UserAvatarCard from './UserAvatarCard';
import { initialExtensionValues, useExtensionPayload } from '@/extensions/forms';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Icon from '@/components/elements/Icon';
import Button from '@/components/elements/Button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import { ServerError } from '@/components/elements/ScreenBlock';
import SubNavigation from '@/components/elements/SubNavigation';
import {
    ExtensionResourceProvider,
    useCurrentResource,
    type ExtensionResourceContext,
} from '@/extensions/resourceContext';
import Slot from '@/extensions/Slot';
import { userDetailRoute } from '@/router/routeTree';
import { languageOptions } from '@/components/admin/languageOptions';
import {
    userFormValues,
    validateFirstName,
    validateLastName,
    validateUserEmail,
    validateUsername,
    validateUserPassword,
} from '@/components/admin/users/userForm';
import type { SelectOption } from '@/components/ui/Select';
import DataTable from '@/components/elements/table/DataTable';
import { actionsColumn, RowActions } from '@/components/elements/table/RowActions';
import ServerEditAction from '@/components/admin/servers/ServerEditAction';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { relationshipData } from '@/api/relationships';
import { resourceNavigation, type ResourceTab } from '@/views/navigation';

type UserForm = AppForm<UserValues>;

const tabs: ResourceTab[] = [{ id: 'about', label: '关于', to: '/panel/users/$id', exact: true }];

const IdentityCard = ({
    form,
    languageOptions,
    languagesLoading,
}: {
    form: UserForm;
    languageOptions: SelectOption[];
    languagesLoading: boolean;
}) => (
    <TitledGreyBox title='身份'>
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
        <div className='mt-6'>
            <form.AppField name='username' validators={{ onChange: validateUsername }}>
                {(field) => (
                    <field.TextField
                        type='text'
                        id='username'
                        label='用户名'
                        description='用于标识此账户的唯一用户名。'
                    />
                )}
            </form.AppField>
        </div>
        <div className='mt-6 flex flex-wrap'>
            <div className='w-full sm:w-1/2 sm:pr-2'>
                <form.AppField name='nameFirst' validators={{ onChange: validateFirstName }}>
                    {(field) => <field.TextField type='text' id='name_first' label='名字' />}
                </form.AppField>
            </div>
            <div className='w-full mt-6 sm:w-1/2 sm:mt-0 sm:pl-2'>
                <form.AppField name='nameLast' validators={{ onChange: validateLastName }}>
                    {(field) => <field.TextField type='text' id='name_last' label='姓氏' />}
                </form.AppField>
            </div>
        </div>
        <div className='mt-6'>
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
                        description='渲染面板时使用的默认语言。'
                    />
                )}
            </form.AppField>
        </div>
        <div className='mt-6'>
            <form.AppField name='rootAdmin'>
                {(field) => <field.SwitchField label='管理员' description='授予此账户对面板的完整管理权限。' />}
            </form.AppField>
        </div>
        <div className='flex justify-end mt-6'>
            <form.AppForm>
                <form.SubmitButton>保存更改</form.SubmitButton>
            </form.AppForm>
        </div>
    </TitledGreyBox>
);

const PasswordCard = ({ form }: { form: UserForm }) => (
    <TitledGreyBox title='密码'>
        <form.AppField name='password' validators={{ onChange: validateUserPassword }}>
            {(field) => (
                <field.TextField
                    type='password'
                    id='password'
                    label='密码'
                    description='留空则保持该用户的密码不变。密码变更时不会向该用户发送任何通知。'
                    autoComplete='new-password'
                />
            )}
        </form.AppField>
        <div className='flex justify-end mt-6'>
            <form.AppForm>
                <form.SubmitButton>保存更改</form.SubmitButton>
            </form.AppForm>
        </div>
    </TitledGreyBox>
);

const DeleteUserCard = ({
    disabled,
    email,
    onDelete,
}: {
    disabled: boolean;
    email: string;
    onDelete: (close: () => void) => Promise<void>;
}) => (
    <TitledGreyBox title='删除用户'>
        <p className='text-sm text-muted-foreground'>删除此账户前，必须确保没有服务器与之关联。</p>
        <div className='flex justify-end mt-6'>
            <Dialog.ConfirmTrigger
                title='删除用户'
                confirm='删除用户'
                trigger={({ onClick }) => (
                    <Button type='button' color='red' disabled={disabled} onClick={onClick}>
                        删除用户
                    </Button>
                )}
                onConfirmed={(_event, close) => onDelete(close)}
            >
                删除 <strong>{email}</strong> 是不可撤销的操作。这将移除该账户及其所有关联数据。
            </Dialog.ConfirmTrigger>
        </div>
    </TitledGreyBox>
);

const ownedServerColumns = [
    {
        id: 'name',
        header: '服务器',
        cell: ({ row }) => (
            <div className='min-w-0'>
                <Link
                    to='/panel/servers/$id'
                    params={{ id: row.original.attributes.id }}
                    className='block truncate text-sm text-foreground hover:text-accent'
                >
                    {row.original.attributes.name}
                </Link>
                <p className='mt-1 font-mono text-xs text-muted-foreground'>
                    {row.original.attributes.identifier}
                    {row.original.attributes.suspended ? <span className='ml-2 text-destructive'>已暂停</span> : null}
                </p>
            </div>
        ),
    },
    {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.attributes.id}</span>,
        meta: { headerClassName: 'w-16 text-right', cellClassName: 'w-16 text-right' },
    },
    actionsColumn<AdminUserServer>(1, (server) => (
        <RowActions>
            <ServerEditAction server={server} />
        </RowActions>
    )),
] satisfies ColumnDef<AdminUserServer>[];

const OwnedServersCard = ({ servers }: { servers: AdminUserServer[] }) => {
    const table = useReactTable({
        data: servers,
        columns: ownedServerColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (server) => server.attributes.uuid,
    });

    return (
        <TitledGreyBox title='服务器' className='mt-4'>
            <DataTable
                table={table}
                emptyState={
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <Server />
                            </EmptyMedia>
                            <EmptyTitle>没有服务器</EmptyTitle>
                            <EmptyDescription>此用户不拥有任何服务器。</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                }
            />
        </TitledGreyBox>
    );
};

const UserDetailContent = ({ user }: { user: AdminUserWithServers }) => {
    const navigate = useNavigate();
    const userId = user.attributes.id;

    const updateUser = useUpdateAdminUser();
    const deleteUser = useDeleteAdminUser();

    const { data: languages, isLoading: languagesLoading } = useAdminLanguages();
    const languagesList = languageOptions(languages, user.attributes.language);

    const { withExtensionPayload } = useExtensionPayload('admin.user');
    const form = useAppForm({
        defaultValues: userFormValues(user),
        onSubmit: async ({ value }) => {
            try {
                await updateUser.mutateAsync(updateAdminUserInput(userId, withExtensionPayload(value, user)));
                form.reset({ ...value, password: '', extensions: initialExtensionValues() });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const onDelete = (close: () => void) =>
        deleteUser
            .mutateAsync(deleteAdminUserInput(userId, user.attributes.email))
            .then(() => navigate({ to: '/panel/users' }))
            .catch(close);

    const servers = relationshipData(user.attributes.relationships?.servers);
    const ownsServers = servers.length > 0;

    return (
        <>
            <Form form={form} className='m-0'>
                <Slot name='panel.users.detail.form' data={{ kind: 'admin.user', resource: user, form }} />
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    <IdentityCard
                        form={form}
                        languageOptions={languagesList}
                        languagesLoading={languagesLoading && !languages}
                    />

                    <div className='flex flex-col gap-4'>
                        <UserAvatarCard user={user} />
                        <PasswordCard form={form} />
                        <DeleteUserCard disabled={ownsServers} email={user.attributes.email} onDelete={onDelete} />
                    </div>
                </div>
                <form.AppField name='extensions'>
                    {() => (
                        <ExtensionFormFields
                            form='admin.user'
                            mode='edit'
                            resource={user}
                            error={updateUser.error}
                            boxed
                            submitLabel='保存更改'
                            className='mt-4'
                        />
                    )}
                </form.AppField>
            </Form>

            <OwnedServersCard servers={servers} />
        </>
    );
};

export function UserDetailLayout() {
    const loadedUser = userDetailRoute.useLoaderData();
    const userId = loadedUser.attributes.id;
    const { data: user = loadedUser, error } = useAdminUserWithServers(userId);

    const resourceContext = useMemo<Extract<ExtensionResourceContext, { kind: 'admin.user' }>>(
        () => ({ kind: 'admin.user', resource: user }),
        [user]
    );

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} />;
    }

    if (!user) {
        return (
            <AdminContentBlock title='管理 · 用户' heading='User'>
                <Spinner size='large' centered />
            </AdminContentBlock>
        );
    }

    return (
        <ExtensionResourceProvider.Provider value={resourceContext}>
            <AdminContentBlock
                title={`管理 · 用户 · ${user.attributes.email}`}
                heading={user.attributes.email}
                description={
                    `${user.attributes.first_name ?? ''} ${user.attributes.last_name ?? ''}`.trim() ||
                    user.attributes.username
                }
            >
                <Link
                    to='/panel/users'
                    className='inline-flex items-center text-sm text-muted-foreground mb-4 hover:text-accent'
                >
                    <Icon icon={ArrowLeft} className='mr-2' />
                    返回用户
                </Link>
                <Slot name='panel.users.detail.actions' data={resourceContext} />
                <SubNavigation
                    className='mb-6 rounded-sm'
                    items={resourceNavigation('admin.user', { id: String(user.attributes.id) }, tabs)}
                />
                <Outlet />
            </AdminContentBlock>
        </ExtensionResourceProvider.Provider>
    );
}

export default function UserDetailContainer() {
    const resource = useCurrentResource();

    if (resource?.kind !== 'admin.user') {
        throw new Error('A user detail tab was rendered without its resource.');
    }

    return <UserDetailContent key={resource.resource.attributes.id} user={resource.resource} />;
}
