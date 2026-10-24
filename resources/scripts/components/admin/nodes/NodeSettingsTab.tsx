import { useAppForm, Form } from '@/components/form';
import { type AdminNode, updateAdminNodeInput, useUpdateAdminNode } from '@/api/admin/nodes/queries';
import { useAllAdminLocations } from '@/api/admin/locations/queries';
import {
    type NodeFormValues,
    nodeFormValues,
    nodeNumberValidators,
    nodeValuesFromForm,
    validateNodeName,
} from '@/components/admin/nodes/nodeForm';
import { useNodeDetail } from '@/components/admin/nodes/useNodeDetail';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { initialExtensionValues, useExtensionPayload } from '@/extensions/forms';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

interface Values extends NodeFormValues {
    resetSecret: boolean;
}

const nodeToValues = (node: AdminNode): Values => ({ ...nodeFormValues(node), resetSecret: false });

const NodeSettingsForm = () => {
    const { node } = useNodeDetail();
    const updateNode = useUpdateAdminNode();

    const { data: locations = [] } = useAllAdminLocations();

    const { withExtensionPayload } = useExtensionPayload('admin.node');
    const form = useAppForm({
        defaultValues: nodeToValues(node),
        onSubmit: async ({ value }) => {
            const { resetSecret, ...values } = value;

            try {
                await updateNode.mutateAsync(
                    updateAdminNodeInput(
                        node.attributes.id,
                        nodeValuesFromForm(withExtensionPayload(values, node)),
                        resetSecret
                    )
                );
                form.setFieldValue('resetSecret', false);
                form.setFieldValue('extensions', initialExtensionValues());
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    return (
        <Form form={form}>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <TitledGreyBox title='设置'>
                    <form.AppField
                        name='name'
                        validators={{
                            onChange: ({ value }) => validateNodeName(value),
                        }}
                    >
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='name'
                                label='节点名称'
                                description='用于区分此节点与其他节点的简短标识。'
                            />
                        )}
                    </form.AppField>
                    <div className='mt-6'>
                        <form.AppField name='description'>
                            {(field) => <field.TextField type='text' id='description' label='描述' />}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField
                            name='locationId'
                            validators={{
                                onChange: ({ value }) => (value >= 1 ? undefined : '必须选择一个地域。'),
                            }}
                        >
                            {(field) => (
                                <field.SelectField
                                    id='location_id'
                                    label='地域'
                                    options={locations.map((location) => ({
                                        value: location.attributes.id,
                                        label: location.attributes.long
                                            ? `${location.attributes.long} (${location.attributes.short})`
                                            : location.attributes.short,
                                    }))}
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField
                            name='fqdn'
                            validators={{
                                onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供 FQDN。'),
                            }}
                        >
                            {(field) => (
                                <field.TextField
                                    type='text'
                                    id='fqdn'
                                    label='完全限定域名（FQDN）'
                                    description='指向此节点的域名或 IP 地址。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='scheme'>
                            {(field) => (
                                <field.SelectField
                                    id='scheme'
                                    label='通过 SSL 通信'
                                    options={[
                                        { value: 'https', label: '使用 SSL 连接 (https)' },
                                        { value: 'http', label: '使用 HTTP 连接 (http)' },
                                    ]}
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='public'>
                            {(field) => (
                                <field.SwitchField label='允许自动分配' description='公共节点可用于自动部署服务器。' />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='behindProxy'>
                            {(field) => (
                                <field.SwitchField
                                    label='位于代理之后'
                                    description='如果此节点位于 Cloudflare 等代理之后，请启用。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='maintenanceMode'>
                            {(field) => (
                                <field.SwitchField
                                    label='维护模式'
                                    description='处于维护模式的节点上的服务器无法访问。'
                                />
                            )}
                        </form.AppField>
                    </div>
                </TitledGreyBox>
                <div className='space-y-6'>
                    <TitledGreyBox title='分配限制'>
                        <div className='grid grid-cols-2 gap-4'>
                            <form.AppField name='memory' validators={nodeNumberValidators.memory}>
                                {(field) => <field.NumberField id='memory' label='总内存 (MiB)' min={1} />}
                            </form.AppField>
                            <form.AppField
                                name='memoryOverallocate'
                                validators={nodeNumberValidators.memoryOverallocate}
                            >
                                {(field) => (
                                    <field.NumberField id='memory_overallocate' label='超额分配（%）' min={-1} />
                                )}
                            </form.AppField>
                            <form.AppField name='disk' validators={nodeNumberValidators.disk}>
                                {(field) => <field.NumberField id='disk' label='磁盘空间 (MiB)' min={1} />}
                            </form.AppField>
                            <form.AppField name='diskOverallocate' validators={nodeNumberValidators.diskOverallocate}>
                                {(field) => <field.NumberField id='disk_overallocate' label='超额分配（%）' min={-1} />}
                            </form.AppField>
                        </div>
                    </TitledGreyBox>
                    <TitledGreyBox title='常规配置'>
                        <form.AppField name='uploadSize' validators={nodeNumberValidators.uploadSize}>
                            {(field) => (
                                <field.NumberField id='upload_size' label='网页上传最大文件大小 (MiB)' min={1} />
                            )}
                        </form.AppField>
                        <div className='mt-6 grid grid-cols-2 gap-4'>
                            <form.AppField name='daemonListen' validators={nodeNumberValidators.daemonListen}>
                                {(field) => (
                                    <field.NumberField id='daemon_listen' label='守护进程端口' min={1} max={65535} />
                                )}
                            </form.AppField>
                            <form.AppField name='daemonSftp' validators={nodeNumberValidators.daemonSftp}>
                                {(field) => (
                                    <field.NumberField
                                        id='daemon_sftp'
                                        label='守护进程 SFTP 端口'
                                        min={1}
                                        max={65535}
                                    />
                                )}
                            </form.AppField>
                        </div>
                        <div className='mt-6'>
                            <form.AppField name='daemonBase'>
                                {(field) => <field.TextField type='text' id='daemon_base' label='守护进程基础路径' />}
                            </form.AppField>
                        </div>
                    </TitledGreyBox>
                </div>
            </div>
            <form.AppField name='extensions'>
                {() => (
                    <ExtensionFormFields
                        form='admin.node'
                        mode='edit'
                        resource={node}
                        error={updateNode.error}
                        boxed
                        className='mt-6'
                    />
                )}
            </form.AppField>
            <TitledGreyBox title='保存设置' className='mt-6'>
                <form.AppField name='resetSecret'>
                    {(field) => (
                        <field.SwitchField
                            label='重置守护进程主密钥'
                            description='重置守护进程主密钥将使所有使用旧密钥的请求失效。此密钥用于服务器创建与删除等所有敏感的守护进程操作。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6 text-right'>
                    <form.AppForm>
                        <form.SubmitButton>保存更改</form.SubmitButton>
                    </form.AppForm>
                </div>
            </TitledGreyBox>
        </Form>
    );
};

export default function NodeSettingsTab() {
    const { node } = useNodeDetail();

    return <NodeSettingsForm key={node.attributes.id} />;
}
