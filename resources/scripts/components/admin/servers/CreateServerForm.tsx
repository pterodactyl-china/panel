import { type ReactNode, useRef, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import {
    createAdminServerInput,
    type EggForServer,
    useAdminEggForServer,
    useAdminServerUnassignedAllocations,
    useCreateAdminServer,
    useFetchAdminEggForServer,
} from '@/api/admin/servers/queries';
import {
    allocationLabel,
    createServerBodyFromFormValues,
    type CreateServerValues,
} from '@/components/admin/servers/helpers';
import { type NumberInputValue, requiredNumber, submittedNumber } from '@/components/admin/numberInput';
import { type AdminUser, useAllAdminUsers } from '@/api/admin/users/queries';
import { type LocationWithNodes, useAdminNodesGroupedByLocation, useAdminNodeTags } from '@/api/admin/nodes/queries';
import { type AdminEggListItem, useAdminEggs } from '@/api/admin/eggs/queries';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import TagCheckAlert from '@/components/admin/tags/TagCheckAlert';
import {
    nodeAcceptsEgg,
    nodeRejectsEggMessage,
    tagCheckError,
    type TagCheckMeta,
} from '@/components/admin/tags/helpers';
import ExtensionFormFields from '@/components/admin/extensions/ExtensionFormFields';
import { type ExtensionFormValues, initialExtensionValues, useExtensionPayload } from '@/extensions/forms';
import Icon from '@/components/elements/Icon';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Label from '@/components/elements/Label';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import type { AppForm } from '@/components/form';
import { useAppForm, Form } from '@/components/form';
import Select from '@/components/ui/Select';
import { relationshipData } from '@/api/relationships';

interface Values extends Omit<
    CreateServerValues,
    'databaseLimit' | 'allocationLimit' | 'backupLimit' | 'cpu' | 'memory' | 'swap' | 'disk' | 'io'
> {
    databaseLimit: NumberInputValue;
    allocationLimit: NumberInputValue;
    backupLimit: NumberInputValue;
    cpu: NumberInputValue;
    memory: NumberInputValue;
    swap: NumberInputValue;
    disk: NumberInputValue;
    io: NumberInputValue;
    extensions: ExtensionFormValues;
}

type ServerForm = AppForm<Values, TagCheckMeta>;

const initialValues: Values = {
    name: '',
    description: '',
    ownerId: 0,
    startOnCompletion: true,

    allocationId: 0,
    allocationAdditional: [],

    databaseLimit: 0,
    allocationLimit: 0,
    backupLimit: 0,

    cpu: 0,
    threads: '',
    memory: 0,
    swap: 0,
    disk: 0,
    io: 500,
    enableOomKiller: true,

    eggId: 0,
    skipScripts: false,

    image: '',
    startup: '',

    environment: {},

    extensions: initialExtensionValues(),
};

const createServerValues = (values: Values): CreateServerValues => ({
    ...values,
    databaseLimit: submittedNumber(values.databaseLimit),
    allocationLimit: submittedNumber(values.allocationLimit),
    backupLimit: submittedNumber(values.backupLimit),
    cpu: submittedNumber(values.cpu),
    memory: submittedNumber(values.memory),
    swap: submittedNumber(values.swap),
    disk: submittedNumber(values.disk),
    io: submittedNumber(values.io),
});

const CoreDetailsBox = ({ form, users }: { form: ServerForm; users: AdminUser[] }) => (
    <TitledGreyBox title='核心详情'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-6'>
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
                            description='字符限制：a-z A-Z 0-9 _ - . 以及 [空格]。'
                        />
                    )}
                </form.AppField>
                <form.AppField
                    name='ownerId'
                    validators={{
                        onChange: ({ value }) => (value >= 1 ? undefined : '必须选择服务器所有者。'),
                    }}
                >
                    {(field) => (
                        <field.SelectField
                            id='ownerId'
                            label='服务器所有者'
                            description='此服务器所属的用户。'
                            options={[
                                { value: 0, label: '选择服务器所有者…', disabled: true },
                                ...users.map((user) => ({
                                    value: user.attributes.id ?? 0,
                                    label: `${user.attributes.email} (${user.attributes.username})`,
                                })),
                            ]}
                        />
                    )}
                </form.AppField>
            </div>
            <div className='space-y-6'>
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
                <div className='mt-6'>
                    <form.AppField name='startOnCompletion'>
                        {(field) => (
                            <field.SwitchField
                                label='安装完成后启动服务器'
                                description='安装完成后自动启动此服务器。'
                            />
                        )}
                    </form.AppField>
                </div>
            </div>
        </div>
    </TitledGreyBox>
);

const AllocationBox = ({
    form,
    locations,
    nodeId,
    onNodeChange,
}: {
    form: ServerForm;
    locations: LocationWithNodes[];
    nodeId: number;
    onNodeChange: (nodeId: number) => void;
}) => {
    const { data: allocationsResponse, isFetching: loading } = useAdminServerUnassignedAllocations(nodeId);
    const allocations = allocationsResponse?.data ?? [];

    const defaultAllocationId = useStore(form.store, (state) => state.values.allocationId);

    const allocationOptions = allocations.map((allocation) => ({
        value: allocation.attributes.id,
        label: allocationLabel(allocation),
    }));

    const additionalOptions = allocationOptions.filter((option) => option.value !== defaultAllocationId);

    return (
        <TitledGreyBox title='分配管理'>
            <div className='relative grid grid-cols-1 md:grid-cols-3 gap-6'>
                {loading && <Spinner size='small' centered />}
                <div>
                    <Label htmlFor='nodeId'>节点</Label>
                    <Select
                        id='nodeId'
                        value={nodeId}
                        placeholder='选择节点…'
                        onChange={(value) => {
                            onNodeChange(Number(value));
                            form.setFieldValue('allocationId', 0);
                            form.setFieldValue('allocationAdditional', []);
                        }}
                        groups={locations.map((group) => ({
                            label: group.location.attributes.long
                                ? `${group.location.attributes.long} (${group.location.attributes.short})`
                                : group.location.attributes.short,
                            options: group.nodes.map((node) => ({ value: node.id, label: node.name })),
                        }))}
                    />
                    <p className='input-help'>此服务器将部署到的节点。</p>
                </div>
                <div>
                    <form.AppField
                        name='allocationId'
                        validators={{
                            onChange: ({ value }) => (value >= 1 ? undefined : '必须选择默认分配。'),
                        }}
                    >
                        {(field) => (
                            <field.SelectField
                                id='allocationId'
                                label='默认分配'
                                description='将分配给此服务器的主分配。'
                                disabled={nodeId <= 0}
                                options={[{ value: 0, label: '选择分配…', disabled: true }, ...allocationOptions]}
                                onChange={(value) =>
                                    form.setFieldValue('allocationAdditional', (current) =>
                                        current.filter((id) => id !== Number(value))
                                    )
                                }
                            />
                        )}
                    </form.AppField>
                </div>
                <div>
                    <form.AppField name='allocationAdditional'>
                        {(field) => (
                            <field.MultiSelectField
                                id='allocationAdditional'
                                label='额外分配'
                                description='创建时额外分配给此服务器的分配。'
                                disabled={nodeId <= 0}
                                options={additionalOptions}
                            />
                        )}
                    </form.AppField>
                </div>
            </div>
        </TitledGreyBox>
    );
};

const FeatureLimitsBox = ({ form }: { form: ServerForm }) => (
    <TitledGreyBox title='应用功能限制'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <form.AppField name='databaseLimit' validators={{ onChange: requiredNumber('必须提供数据库限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='databaseLimit'
                        label='数据库限制'
                        min={0}
                        description='用户可为此服务器创建的数据库总数。'
                    />
                )}
            </form.AppField>
            <form.AppField name='allocationLimit' validators={{ onChange: requiredNumber('必须提供分配限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='allocationLimit'
                        label='分配限制'
                        min={0}
                        description='用户可为此服务器创建的分配总数。'
                    />
                )}
            </form.AppField>
            <form.AppField name='backupLimit' validators={{ onChange: requiredNumber('必须提供备份限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='backupLimit'
                        label='备份限制'
                        min={0}
                        description='此服务器可创建的备份总数。'
                    />
                )}
            </form.AppField>
        </div>
    </TitledGreyBox>
);

const ResourceManagementBox = ({ form }: { form: ServerForm }) => (
    <TitledGreyBox title='资源管理'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <form.AppField name='cpu' validators={{ onChange: requiredNumber('必须提供 CPU 限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='cpu'
                        label='CPU 限制 (%)'
                        min={0}
                        description='设为 0 表示不限制 CPU 使用。100% 相当于一个线程。'
                    />
                )}
            </form.AppField>
            <form.AppField name='threads'>
                {(field) => (
                    <field.TextField
                        type='text'
                        id='threads'
                        label='CPU 绑定'
                        description='高级：指定 CPU 线程（例如 0, 0-1,3），留空表示全部。'
                    />
                )}
            </form.AppField>
            <form.AppField name='memory' validators={{ onChange: requiredNumber('必须提供内存限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='memory'
                        label='内存 (MiB)'
                        min={0}
                        description='允许的最大内存。设为 0 表示不限制。'
                    />
                )}
            </form.AppField>
            <form.AppField name='swap' validators={{ onChange: requiredNumber('必须提供交换分区限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='swap'
                        label='交换分区 (MiB)'
                        min={-1}
                        description='设为 0 禁用交换分区，设为 -1 表示不限制。'
                    />
                )}
            </form.AppField>
            <form.AppField name='disk' validators={{ onChange: requiredNumber('必须提供磁盘限制。') }}>
                {(field) => (
                    <field.NumberField
                        id='disk'
                        label='磁盘空间 (MiB)'
                        min={0}
                        description='设为 0 表示不限制磁盘使用。'
                    />
                )}
            </form.AppField>
            <form.AppField
                name='io'
                validators={{
                    onChange: requiredNumber('必须提供块 IO 权重。', (value) =>
                        value >= 10 && value <= 1000 ? undefined : '块 IO 权重必须介于 10 与 1000 之间。'
                    ),
                }}
            >
                {(field) => (
                    <field.NumberField
                        id='io'
                        label='块 IO 权重'
                        min={10}
                        max={1000}
                        description='高级：相对于其他容器的 IO 性能（10 到 1000）。'
                    />
                )}
            </form.AppField>
        </div>
        <div className='mt-6'>
            <form.AppField name='enableOomKiller'>
                {(field) => (
                    <field.SwitchField
                        label='启用 OOM Killer'
                        description='当服务器超出内存限制时终止它。启用 OOM Killer 可能导致服务器进程意外退出。'
                    />
                )}
            </form.AppField>
        </div>
    </TitledGreyBox>
);

const EggConfigurationBox = ({
    form,
    eggs,
    loadEgg,
    loading,
}: {
    form: ServerForm;
    eggs: AdminEggListItem[];
    loadEgg: (eggId: number) => void;
    loading: boolean;
}) => {
    const eggId = useStore(form.store, (state) => Number(state.values.eggId ?? 0));

    return (
        <TitledGreyBox title='预设配置'>
            <div className='relative space-y-6'>
                {loading && <Spinner size='small' centered />}
                <div>
                    <Label htmlFor='eggId'>预设</Label>
                    <Select
                        id='eggId'
                        value={eggId}
                        placeholder='选择预设…'
                        options={eggs.map((egg) => ({ value: egg.attributes.id, label: egg.attributes.name }))}
                        onChange={(value) => {
                            const nextEggId = Number(value);

                            form.setFieldValue('eggId', nextEggId);
                            loadEgg(nextEggId);
                        }}
                    />
                    <p className='input-help'>选择用于定义此服务器运行方式的预设。</p>
                </div>
                <div>
                    <form.AppField name='skipScripts'>
                        {(field) => (
                            <field.SwitchField
                                label='跳过预设安装脚本'
                                description='如果关联了安装脚本，则在安装时跳过它。'
                            />
                        )}
                    </form.AppField>
                </div>
            </div>
        </TitledGreyBox>
    );
};

const DockerImageBox = ({ form, egg }: { form: ServerForm; egg: EggForServer | null }) => {
    const image = useStore(form.store, (state) => state.values.image);
    const images = egg ? Object.entries(egg.attributes.docker_images) : [];
    const isCustom = !images.some(([, value]) => value === image);

    return (
        <TitledGreyBox title='Docker 配置'>
            <div className='space-y-4'>
                <div>
                    <Label htmlFor='image'>Docker 镜像</Label>
                    <Select
                        id='image'
                        value={isCustom ? 'custom' : image}
                        disabled={!egg}
                        onChange={(value) => form.setFieldValue('image', value === 'custom' ? '' : String(value))}
                        options={[
                            ...images.map(([name, value]) => ({ value, label: `${name} (${value})` })),
                            { value: 'custom', label: '自定义镜像…' },
                        ]}
                    />
                </div>
                {(isCustom || images.length === 0) && (
                    <form.AppField
                        name='image'
                        validators={{
                            onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供 Docker 镜像。'),
                        }}
                    >
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='customImage'
                                label='自定义镜像'
                                placeholder='或输入自定义镜像…'
                                description='运行此服务器使用的默认 Docker 镜像。'
                            />
                        )}
                    </form.AppField>
                )}
            </div>
        </TitledGreyBox>
    );
};

const StartupBox = ({ form, egg }: { form: ServerForm; egg: EggForServer | null }) => {
    const variables = relationshipData(egg?.attributes.relationships?.variables);

    return (
        <TitledGreyBox title='启动配置'>
            <form.AppField
                name='startup'
                validators={{
                    onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供启动命令。'),
                }}
            >
                {(field) => (
                    <field.TextField
                        type='text'
                        id='startup'
                        label='启动命令'
                        description='可用的替换变量：{{SERVER_MEMORY}}、{{SERVER_IP}} 和 {{SERVER_PORT}}。'
                    />
                )}
            </form.AppField>
            {variables.length > 0 && (
                <div className='mt-6'>
                    <p className='text-sm uppercase text-muted-foreground mb-4'>服务变量</p>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {variables.map(({ attributes }) => (
                            <form.AppField key={attributes.id} name={`environment.${attributes.env_variable}`}>
                                {(field) => (
                                    <field.TextField
                                        id={`env_${attributes.env_variable}`}
                                        label={attributes.name}
                                        description={attributes.description}
                                    />
                                )}
                            </form.AppField>
                        ))}
                    </div>
                </div>
            )}
        </TitledGreyBox>
    );
};

const EggSection = ({ form, eggs }: { form: ServerForm; eggs: AdminEggListItem[] }) => {
    const eggId = useStore(form.store, (state) => Number(state.values.eggId ?? 0));
    const fetchEgg = useFetchAdminEggForServer();

    const { data: egg = null, isFetching: loading } = useAdminEggForServer(eggId);
    const latestEggLoad = useRef(0);

    const loadEgg = async (nextEggId: number) => {
        const eggLoad = ++latestEggLoad.current;

        if (nextEggId <= 0) {
            form.setFieldValue('startup', '');
            form.setFieldValue('image', '');
            form.setFieldValue('environment', {});

            return;
        }

        const nextEgg = await fetchEgg(nextEggId);

        if (!nextEgg || eggLoad !== latestEggLoad.current) {
            return;
        }

        form.setFieldValue('startup', nextEgg.attributes.startup);

        const images = Object.values(nextEgg.attributes.docker_images);

        form.setFieldValue('image', images.length > 0 ? images[0] : '');

        const environment: Record<string, string> = {};

        for (const { attributes } of relationshipData(nextEgg.attributes.relationships?.variables)) {
            environment[attributes.env_variable] = attributes.default_value;
        }

        form.setFieldValue('environment', environment);
    };

    return (
        <>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <EggConfigurationBox
                    form={form}
                    eggs={eggs}
                    loadEgg={(nextEggId) => void loadEgg(nextEggId)}
                    loading={loading}
                />
                <DockerImageBox form={form} egg={egg} />
            </div>
            <StartupBox form={form} egg={egg} />
        </>
    );
};

interface TagRejection {
    message: string;
    nodeId: number;
    eggId: number;
}

const TagCheck = ({
    nodeId,
    eggId,
    rejection,
    pending,
    onCreateAnyway,
}: {
    nodeId: number;
    eggId: number;
    rejection: TagRejection | null;
    pending: boolean;
    onCreateAnyway: () => void;
}) => {
    const { data: node } = useAdminNodeTags(nodeId);
    const { data: egg } = useAdminEggForServer(eggId);

    if (rejection?.nodeId === nodeId && rejection.eggId === eggId) {
        return (
            <TagCheckAlert message={rejection.message} action='仍然创建' pending={pending} onAction={onCreateAnyway} />
        );
    }

    const nodeTags = relationshipData(node?.attributes.relationships?.tags);

    if (!node || !egg || nodeAcceptsEgg(nodeTags, relationshipData(egg.attributes.relationships?.tags))) {
        return null;
    }

    return <TagCheckAlert message={nodeRejectsEggMessage(node.attributes.name, nodeTags)} />;
};

const NoNodesAlert = () => (
    <Alert type='warning' className='text-sm'>
        <span>
            在为面板添加服务器之前，至少需要配置一个节点。{' '}
            <Link to='/panel/nodes' className='font-medium underline'>
                管理节点
            </Link>
        </span>
    </Alert>
);

const CreateServerBody = ({
    loading,
    hasNodes,
    children,
}: {
    loading: boolean;
    hasNodes: boolean;
    children: ReactNode;
}) => {
    if (loading) {
        return <Spinner size='large' centered />;
    }

    if (!hasNodes) {
        return <NoNodesAlert />;
    }

    return children;
};

export default function CreateServerForm() {
    const navigate = useNavigate();
    const createServer = useCreateAdminServer();

    const { data: users = [], isLoading: usersLoading } = useAllAdminUsers();
    const { data: locations = [], isLoading: locationsLoading } = useAdminNodesGroupedByLocation();
    const { data: eggs, isLoading: eggsLoading } = useAdminEggs();

    const loading = usersLoading || locationsLoading || eggsLoading;
    const hasNodes = locations.some((location) => location.nodes.length > 0);

    const [nodeId, setNodeId] = useState(0);
    const [rejection, setRejection] = useState<TagRejection | null>(null);

    const { extensionFormPayload } = useExtensionPayload('admin.server');
    const form = useAppForm({
        defaultValues: initialValues,
        onSubmitMeta: { ignoreTags: false },
        onSubmit: async ({ value, meta }) => {
            try {
                const server = await createServer.mutateAsync(
                    createAdminServerInput({
                        ...createServerBodyFromFormValues(createServerValues(value)),
                        ignore_tags: meta.ignoreTags,
                        extensions: extensionFormPayload(value.extensions),
                    })
                );

                void navigate({ to: '/panel/servers/$id', params: { id: server.attributes.id } });
            } catch (error) {
                const message = tagCheckError(error, 'primary_allocation_id');

                setRejection(message === null ? null : { message, nodeId, eggId: value.eggId });
            }
        },
    });
    const eggId = useStore(form.store, (state) => Number(state.values.eggId ?? 0));
    const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

    return (
        <AdminContentBlock
            title='管理 · 创建服务器'
            heading='创建服务器'
            description='在您的某个节点上创建游戏服务器。'
        >
            <Link
                to='/panel/servers'
                className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
            >
                <Icon icon={ArrowLeft} className='mr-2' />
                返回服务器
            </Link>
            <CreateServerBody loading={loading} hasNodes={hasNodes}>
                <Form form={form}>
                    <div className='space-y-6'>
                        <CoreDetailsBox form={form} users={users} />
                        <AllocationBox form={form} locations={locations} nodeId={nodeId} onNodeChange={setNodeId} />
                        <FeatureLimitsBox form={form} />
                        <ResourceManagementBox form={form} />
                        <EggSection form={form} eggs={eggs?.data ?? []} />
                        <form.AppField name='extensions'>
                            {() => (
                                <ExtensionFormFields
                                    form='admin.server'
                                    mode='create'
                                    error={createServer.error}
                                    boxed
                                />
                            )}
                        </form.AppField>
                        <TagCheck
                            nodeId={nodeId}
                            eggId={eggId}
                            rejection={rejection}
                            pending={isSubmitting}
                            onCreateAnyway={() => void form.handleSubmit({ ignoreTags: true })}
                        />
                        <div className='flex justify-end'>
                            <form.AppForm>
                                <form.SubmitButton>创建服务器</form.SubmitButton>
                            </form.AppForm>
                        </div>
                    </div>
                </Form>
            </CreateServerBody>
        </AdminContentBlock>
    );
}
