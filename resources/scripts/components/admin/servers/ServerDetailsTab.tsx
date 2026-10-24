import { useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { useAppForm, Form } from '@/components/form';
import {
    type AdminServer,
    updateAdminServerDetailsInput,
    useUpdateAdminServerDetails,
} from '@/api/admin/servers/queries';
import { serverDetailsBodyFromFormValues } from '@/components/admin/servers/helpers';
import { useAdminUsers } from '@/api/admin/users/queries';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { initialExtensionValues, useExtensionPayload } from '@/extensions/forms';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerError } from '@/components/elements/ScreenBlock';
import { relationshipAttributes } from '@/api/relationships';
import { useDebouncedValue } from '@/plugins/useDebouncedValue';
import type { SelectOption } from '@/components/ui/Select';

interface Props {
    server: AdminServer;
}

type OwnerOption = {
    id: number;
    email: string;
    name: string;
    image: string;
};

interface OwnerUser {
    id: number;
    email: string;
    image: string;
    first_name: string;
    last_name: string;
    username: string;
}

const ownerOption = (user: OwnerUser): OwnerOption => ({
    id: user.id,
    email: user.email,
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
    image: user.image,
});

const ownerSelectOption = (user: OwnerOption): SelectOption => ({
    value: user.id,
    textLabel: `${user.name} (${user.email})`,
    label: (
        <span className='flex min-w-0 items-center gap-3'>
            <img
                className='h-8 w-8 shrink-0 rounded-full border border-border bg-background'
                src={`${user.image}?s=100`}
                alt=''
            />
            <span className='min-w-0'>
                <span className='block truncate'>{user.name}</span>
                <span className='block truncate text-xs text-muted-foreground'>{user.email}</span>
            </span>
        </span>
    ),
});

function ServerDetailsForm({ server }: Props) {
    const { attributes } = server;
    const [search, setSearch] = useState('');
    const [pickedOwner, setPickedOwner] = useState<OwnerOption | null>(null);
    const updateServerDetails = useUpdateAdminServerDetails();

    const debouncedSearch = useDebouncedValue(search, 500);
    const { data: searchResult, isFetching: isSearching } = useAdminUsers({
        page: 1,
        filters: { search: debouncedSearch.trim() },
    });

    const { extensionFormPayload } = useExtensionPayload('admin.server');
    const form = useAppForm({
        defaultValues: {
            name: attributes.name,
            user: attributes.user,
            externalId: attributes.external_id ?? '',
            description: attributes.description ?? '',
            extensions: initialExtensionValues(),
        },
        onSubmit: async ({ value }) => {
            try {
                await updateServerDetails.mutateAsync(
                    updateAdminServerDetailsInput(attributes.id, {
                        ...serverDetailsBodyFromFormValues({
                            name: value.name,
                            user: Number(value.user),
                            externalId: value.externalId,
                            description: value.description,
                        }),
                        extensions: extensionFormPayload(value.extensions, server),
                    })
                );
                form.setFieldValue('extensions', initialExtensionValues());
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    // The selected owner stays in the options while a search narrows the results.
    const selectedOwnerId = useStore(form.store, (state) => state.values.user);
    const users = searchResult?.data.map(({ attributes }) => ownerOption(attributes)) ?? [];
    const persistedOwner = relationshipAttributes(attributes.relationships?.user);
    const selectedOwner = [pickedOwner, persistedOwner ? ownerOption(persistedOwner) : null].find(
        (candidate) => candidate?.id === selectedOwnerId
    );

    if (selectedOwner && !users.some((user) => user.id === selectedOwner.id)) {
        users.unshift(selectedOwner);
    }

    const pickOwner = (value: string | number) => {
        const option = users.find((user) => user.id === Number(value));

        if (option) {
            setPickedOwner(option);
        }
    };

    return (
        <Form form={form}>
            <TitledGreyBox title='基本信息'>
                <form.AppField
                    name='name'
                    validators={{
                        onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供服务器名称。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='name'
                            label='服务器名称'
                            description='字符限制：a-zA-Z0-9_- 以及 [空格]。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6'>
                    <form.AppField name='externalId'>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='external_id'
                                label='外部标识符'
                                description='留空则不为该服务器分配外部标识符。外部 ID 应在该服务器上唯一，且不被其他服务器使用。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='user'>
                        {(field) => (
                            <field.SelectField
                                id='user'
                                label='服务器所有者'
                                placeholder='按姓名、用户名或电子邮箱搜索用户…'
                                emptyMessage={
                                    isSearching || search !== debouncedSearch ? 'Searching…' : '没有找到匹配的用户。'
                                }
                                options={users.map(ownerSelectOption)}
                                onChange={pickOwner}
                                onSearchChange={setSearch}
                                description='更改所有者将自动生成新的守护进程安全令牌。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='mt-6'>
                    <form.AppField name='description'>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='description'
                                label='服务器描述'
                                description='此服务器的简要描述。'
                            />
                        )}
                    </form.AppField>
                </div>
                <form.AppField name='extensions'>
                    {() => (
                        <ExtensionFormFields
                            form='admin.server'
                            mode='edit'
                            resource={server}
                            error={updateServerDetails.error}
                            className='mt-6'
                        />
                    )}
                </form.AppField>
                <div className='flex justify-end mt-6'>
                    <form.AppForm>
                        <form.SubmitButton>更新详情</form.SubmitButton>
                    </form.AppForm>
                </div>
            </TitledGreyBox>
        </Form>
    );
}

export default function ServerDetailsTab() {
    const { server } = useServerDetail();

    if (server.attributes.container.installed !== 1) {
        return <ServerError message='由于当前安装状态，不允许访问此资源。' />;
    }

    return <ServerDetailsForm key={`${server.attributes.id}:${server.attributes.updated_at}`} server={server} />;
}
