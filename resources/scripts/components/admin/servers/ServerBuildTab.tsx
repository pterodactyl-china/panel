import { useStore } from '@tanstack/react-form';
import { useAppForm, Form } from '@/components/form';
import {
    type AdminServer,
    updateAdminServerBuildInput,
    useAdminServerBuildAllocations,
    useAdminServerUnassignedAllocations,
    useUpdateAdminServerBuild,
} from '@/api/admin/servers/queries';
import {
    allocationLabel,
    serverBuildBodyFromFormValues,
    type ServerBuildValues,
} from '@/components/admin/servers/helpers';
import { type NumberInputValue, requiredNumber, submittedNumber } from '@/components/admin/numberInput';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerError } from '@/components/elements/ScreenBlock';

interface Props {
    server: AdminServer;
}

interface Values {
    cpu: NumberInputValue;
    threads: string;
    memory: NumberInputValue;
    swap: NumberInputValue;
    disk: NumberInputValue;
    io: NumberInputValue;
    oomDisabled: string;
    databaseLimit: NumberInputValue;
    allocationLimit: NumberInputValue;
    backupLimit: NumberInputValue;
    allocationId: number;
    addAllocations: number[];
    removeAllocations: number[];
}

const serverToValues = (server: AdminServer): Values => ({
    cpu: server.attributes.limits.cpu,
    threads: server.attributes.limits.threads ?? '',
    memory: server.attributes.limits.memory,
    swap: server.attributes.limits.swap,
    disk: server.attributes.limits.disk,
    io: server.attributes.limits.io,
    oomDisabled: server.attributes.limits.oom_disabled ? 'true' : 'false',
    databaseLimit: server.attributes.feature_limits.databases ?? 0,
    allocationLimit: server.attributes.feature_limits.allocations ?? 0,
    backupLimit: server.attributes.feature_limits.backups,
    allocationId: server.attributes.allocation,
    addAllocations: [],
    removeAllocations: [],
});

const validateCpu = requiredNumber('必须提供 CPU 限制。', (value) => (value >= 0 ? undefined : 'CPU 限制无效。'));
const validateMemory = requiredNumber('必须提供内存限制。', (value) => (value >= 0 ? undefined : '内存限制无效。'));
const validateSwap = requiredNumber('必须提供交换分区限制。', (value) =>
    value >= -1 ? undefined : '交换分区限制无效。'
);
const validateDisk = requiredNumber('必须提供磁盘限制。', (value) => (value >= 0 ? undefined : '磁盘限制无效。'));
const validateIo = requiredNumber('必须提供 IO 比例。', (value): string | undefined => {
    if (value < 10) {
        return 'IO 比例不能小于 10。';
    }

    if (value > 1000) {
        return 'IO 比例不得超过 1000。';
    }

    return undefined;
});
const validateDatabaseLimit = requiredNumber('必须提供数据库限制。', (value) =>
    value >= 0 ? undefined : '数据库限制无效。'
);
const validateAllocationLimit = requiredNumber('必须提供端口配额。', (value) =>
    value >= 0 ? undefined : '端口配额无效。'
);
const validateBackupLimit = requiredNumber('必须提供备份限制。', (value) =>
    value >= 0 ? undefined : '备份限制无效。'
);

function ServerBuildForm({ server }: Props) {
    const { attributes } = server;
    const updateServerBuild = useUpdateAdminServerBuild();

    const { data: assignedResponse } = useAdminServerBuildAllocations(attributes.id, attributes.node);
    const assigned = assignedResponse?.data ?? [];

    const { data: unassignedResponse } = useAdminServerUnassignedAllocations(attributes.node);
    const unassigned = unassignedResponse?.data ?? [];

    const form = useAppForm({
        defaultValues: serverToValues(server),
        onSubmit: async ({ value }) => {
            const payload: ServerBuildValues = {
                allocationId: Number(value.allocationId),
                addAllocations: value.addAllocations.map(Number),
                removeAllocations: value.removeAllocations.map(Number),
                oomDisabled: value.oomDisabled === 'true',
                limits: {
                    cpu: submittedNumber(value.cpu),
                    threads: value.threads,
                    memory: submittedNumber(value.memory),
                    swap: submittedNumber(value.swap),
                    disk: submittedNumber(value.disk),
                    io: submittedNumber(value.io),
                },
                featureLimits: {
                    databases: submittedNumber(value.databaseLimit),
                    allocations: submittedNumber(value.allocationLimit),
                    backups: submittedNumber(value.backupLimit),
                },
            };

            try {
                await updateServerBuild.mutateAsync(
                    updateAdminServerBuildInput(attributes.id, serverBuildBodyFromFormValues(payload))
                );
                form.reset({ ...value, addAllocations: [], removeAllocations: [] });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    const defaultAllocationId = useStore(form.store, (state) => state.values.allocationId);

    const assignedOptions = assigned.map((allocation) => ({
        value: allocation.attributes.id,
        label: allocationLabel(allocation),
    }));

    const removableOptions = assignedOptions.filter((option) => option.value !== defaultAllocationId);

    return (
        <Form form={form}>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <TitledGreyBox title='资源管理'>
                    <form.AppField name='cpu' validators={{ onChange: validateCpu }}>
                        {(field) => (
                            <field.NumberField
                                id='cpu'
                                label='CPU 限制 (%)'
                                min={0}
                                description='系统中每个线程为 100%。设为 0 表示不限制 CPU。'
                            />
                        )}
                    </form.AppField>
                    <div className='mt-6'>
                        <form.AppField name='threads'>
                            {(field) => (
                                <field.TextField
                                    type='text'
                                    id='threads'
                                    label='CPU 绑定'
                                    description='高级：此进程可运行的特定 CPU 核心（例如 0, 0-1,3）。留空表示允许使用所有核心。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='memory' validators={{ onChange: validateMemory }}>
                            {(field) => (
                                <field.NumberField
                                    id='memory'
                                    label='已分配内存 (MiB)'
                                    min={0}
                                    description='此容器的最大内存。设为 0 表示不限制。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='swap' validators={{ onChange: validateSwap }}>
                            {(field) => (
                                <field.NumberField
                                    id='swap'
                                    label='已分配交换分区 (MiB)'
                                    min={-1}
                                    description='设为 0 禁用交换分区，设为 -1 表示不限制。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='disk' validators={{ onChange: validateDisk }}>
                            {(field) => (
                                <field.NumberField
                                    id='disk'
                                    label='磁盘空间限制 (MiB)'
                                    min={0}
                                    description='设为 0 表示不限制磁盘使用。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='io' validators={{ onChange: validateIo }}>
                            {(field) => (
                                <field.NumberField
                                    id='io'
                                    label='块 IO 比例'
                                    min={10}
                                    max={1000}
                                    description='高级：取值介于 10 与 1000 之间。'
                                />
                            )}
                        </form.AppField>
                    </div>
                    <div className='mt-6'>
                        <form.AppField name='oomDisabled'>
                            {(field) => (
                                <field.SelectField
                                    id='oomDisabled'
                                    label='OOM 终止器'
                                    description='启用 OOM Killer 可能导致服务器进程意外退出。'
                                    options={[
                                        { value: 'false', label: '已启用' },
                                        { value: 'true', label: '已禁用' },
                                    ]}
                                />
                            )}
                        </form.AppField>
                    </div>
                </TitledGreyBox>
                <div className='space-y-6'>
                    <TitledGreyBox title='应用功能限制'>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                            <form.AppField name='databaseLimit' validators={{ onChange: validateDatabaseLimit }}>
                                {(field) => <field.NumberField id='database_limit' label='数据库限制' min={0} />}
                            </form.AppField>
                            <form.AppField name='allocationLimit' validators={{ onChange: validateAllocationLimit }}>
                                {(field) => <field.NumberField id='allocation_limit' label='分配限制' min={0} />}
                            </form.AppField>
                            <form.AppField name='backupLimit' validators={{ onChange: validateBackupLimit }}>
                                {(field) => <field.NumberField id='backup_limit' label='备份限制' min={0} />}
                            </form.AppField>
                        </div>
                    </TitledGreyBox>
                    <TitledGreyBox title='端口管理'>
                        <form.AppField name='allocationId'>
                            {(field) => (
                                <field.SelectField
                                    id='allocationId'
                                    label='游戏端口'
                                    description='此服务器的默认连接地址。'
                                    options={assignedOptions}
                                    onChange={(value) =>
                                        form.setFieldValue('removeAllocations', (current) =>
                                            current.filter((id) => id !== Number(value))
                                        )
                                    }
                                />
                            )}
                        </form.AppField>
                        <div className='mt-6'>
                            <form.AppField name='addAllocations'>
                                {(field) => (
                                    <field.MultiSelectField
                                        id='addAllocations'
                                        label='新增端口'
                                        description='将分配给该服务器的空闲端口。'
                                        options={unassigned.map((allocation) => ({
                                            value: allocation.attributes.id,
                                            label: allocationLabel(allocation),
                                        }))}
                                    />
                                )}
                            </form.AppField>
                        </div>
                        <div className='mt-6'>
                            <form.AppField name='removeAllocations'>
                                {(field) => (
                                    <field.MultiSelectField
                                        id='removeAllocations'
                                        label='移除额外端口'
                                        description='选择要从此服务器移除的端口。'
                                        options={removableOptions}
                                    />
                                )}
                            </form.AppField>
                        </div>
                    </TitledGreyBox>
                </div>
            </div>
            <div className='flex justify-end mt-6'>
                <form.AppForm>
                    <form.SubmitButton>更新构建配置</form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    );
}

export default function ServerBuildTab() {
    const { server } = useServerDetail();

    if (server.attributes.container.installed !== 1) {
        return <ServerError message='由于当前安装状态，不允许访问此资源。' />;
    }

    return <ServerBuildForm key={`${server.attributes.id}:${server.attributes.updated_at}`} server={server} />;
}
