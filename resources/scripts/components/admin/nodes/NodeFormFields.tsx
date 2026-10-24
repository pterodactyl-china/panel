import type { AppForm } from '@/components/form';
import { type AdminLocation, useAllAdminLocations } from '@/api/admin/locations/queries';
import { type NodeFormValues, nodeNumberValidators, validateNodeName } from '@/components/admin/nodes/nodeForm';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

interface Props {
    form: AppForm<NodeFormValues>;
    prefix?: string;
    requiresSslScheme?: boolean;
}

type LocationOption = AdminLocation;

interface FormFieldsProps {
    form: AppForm<NodeFormValues>;
    prefix: string;
}

interface IdentityFieldsProps extends FormFieldsProps {
    locations: LocationOption[];
}

interface NetworkFieldsProps extends FormFieldsProps {
    requiresSslScheme: boolean;
}

const IdentityFields = ({ form, locations, prefix }: IdentityFieldsProps) => (
    <div className='space-y-6'>
        <form.AppField
            name='name'
            validators={{
                onChange: ({ value }) => validateNodeName(value),
            }}
        >
            {(field) => (
                <field.TextField
                    type='text'
                    id={`${prefix}name`}
                    label='名称'
                    description='用于区分此节点与其他节点的简短标识。'
                />
            )}
        </form.AppField>
        <form.AppField name='description'>
            {(field) => (
                <field.TextField
                    type='text'
                    id={`${prefix}description`}
                    label='描述'
                    description='此节点的详细描述。'
                />
            )}
        </form.AppField>
        <form.AppField
            name='locationId'
            validators={{
                onChange: ({ value }) => (value >= 1 ? undefined : '必须选择一个地域。'),
            }}
        >
            {(field) => (
                <field.SelectField
                    id={`${prefix}location_id`}
                    label='地域'
                    options={locations.map((location) => ({
                        value: location.attributes.id,
                        label: location.attributes.short,
                    }))}
                />
            )}
        </form.AppField>
    </div>
);

const NetworkFields = ({ form, prefix, requiresSslScheme }: NetworkFieldsProps) => {
    const schemeDescription = requiresSslScheme
        ? '面板正在使用 HTTPS，因此浏览器要求节点连接使用 SSL。'
        : '多数情况下应使用 SSL。仅对不支持 SSL 的节点使用 HTTP。';

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-6'>
                <form.AppField
                    name='fqdn'
                    validators={{
                        onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供 FQDN。'),
                    }}
                >
                    {(field) => (
                        <field.TextField
                            type='text'
                            id={`${prefix}fqdn`}
                            label='完全限定域名（FQDN）'
                            description='指向此节点的域名或 IP 地址。'
                        />
                    )}
                </form.AppField>
                <form.AppField
                    name='scheme'
                    validators={{
                        onChange: ({ value }) =>
                            requiresSslScheme && value === 'http'
                                ? '面板通过 HTTPS 访问时无法使用 HTTP 节点连接。'
                                : undefined,
                    }}
                >
                    {(field) => (
                        <field.SelectField
                            id={`${prefix}scheme`}
                            label='通过 SSL 通信'
                            options={[
                                { value: 'https', label: '使用 SSL 连接 (https)' },
                                {
                                    value: 'http',
                                    label: '使用 HTTP 连接 (http)',
                                    disabled: requiresSslScheme,
                                },
                            ]}
                            description={schemeDescription}
                        />
                    )}
                </form.AppField>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5'>
                <form.AppField name='public'>
                    {(field) => (
                        <field.SwitchField
                            label='节点可见性'
                            description='公共节点可用于自动部署服务器。'
                            controlPosition='end'
                            className='w-full'
                        />
                    )}
                </form.AppField>
                <form.AppField name='behindProxy'>
                    {(field) => (
                        <field.SwitchField
                            label='位于代理之后'
                            description='如果此节点位于 Cloudflare 等代理之后，请启用。'
                            controlPosition='end'
                            className='w-full'
                        />
                    )}
                </form.AppField>
                <form.AppField name='maintenanceMode'>
                    {(field) => (
                        <field.SwitchField
                            label='维护模式'
                            description='处于维护模式的节点上的服务器无法访问。'
                            controlPosition='end'
                            className='w-full sm:col-span-2 xl:col-span-1'
                        />
                    )}
                </form.AppField>
            </div>
        </div>
    );
};

const ResourceFields = ({ form, prefix }: FormFieldsProps) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6'>
        <form.AppField name='memory' validators={nodeNumberValidators.memory}>
            {(field) => <field.NumberField id={`${prefix}memory`} label='内存 (MiB)' min={1} />}
        </form.AppField>
        <form.AppField name='memoryOverallocate' validators={nodeNumberValidators.memoryOverallocate}>
            {(field) => <field.NumberField id={`${prefix}memory_overallocate`} label='内存超额分配 (%)' min={-1} />}
        </form.AppField>
        <form.AppField name='disk' validators={nodeNumberValidators.disk}>
            {(field) => <field.NumberField id={`${prefix}disk`} label='磁盘空间 (MiB)' min={1} />}
        </form.AppField>
        <form.AppField name='diskOverallocate' validators={nodeNumberValidators.diskOverallocate}>
            {(field) => <field.NumberField id={`${prefix}disk_overallocate`} label='磁盘超额分配 (%)' min={-1} />}
        </form.AppField>
    </div>
);

const DaemonFields = ({ form, prefix }: FormFieldsProps) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[12rem_12rem_12rem_1fr] gap-6'>
        <form.AppField name='daemonListen' validators={nodeNumberValidators.daemonListen}>
            {(field) => <field.NumberField id={`${prefix}daemon_listen`} label='守护进程端口' min={1} max={65535} />}
        </form.AppField>
        <form.AppField name='daemonSftp' validators={nodeNumberValidators.daemonSftp}>
            {(field) => (
                <field.NumberField id={`${prefix}daemon_sftp`} label='守护进程 SFTP 端口' min={1} max={65535} />
            )}
        </form.AppField>
        <form.AppField name='uploadSize' validators={nodeNumberValidators.uploadSize}>
            {(field) => <field.NumberField id={`${prefix}upload_size`} label='上传大小限制 (MiB)' min={1} />}
        </form.AppField>
        <form.AppField name='daemonBase'>
            {(field) => <field.TextField type='text' id={`${prefix}daemon_base`} label='守护进程基础路径' />}
        </form.AppField>
    </div>
);

export default function NodeFormFields({ form, prefix = '', requiresSslScheme = false }: Props) {
    const { data: locations = [] } = useAllAdminLocations();

    return (
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
            <TitledGreyBox title='身份'>
                <IdentityFields form={form} locations={locations} prefix={prefix} />
            </TitledGreyBox>
            <TitledGreyBox title='网络'>
                <NetworkFields form={form} prefix={prefix} requiresSslScheme={requiresSslScheme} />
            </TitledGreyBox>
            <TitledGreyBox title='资源限制' className='xl:col-span-2'>
                <ResourceFields form={form} prefix={prefix} />
            </TitledGreyBox>
            <TitledGreyBox title='守护进程' className='xl:col-span-2'>
                <DaemonFields form={form} prefix={prefix} />
            </TitledGreyBox>
        </div>
    );
}
