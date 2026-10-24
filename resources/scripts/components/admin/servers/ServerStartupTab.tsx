import { useRef, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { Variable } from 'lucide-react';
import type { AppForm } from '@/components/form';
import { useAppForm, Form } from '@/components/form';
import Select from '@/components/ui/Select';
import {
    type AdminServer,
    type EggForServer,
    updateAdminServerStartupInput,
    useAdminEggForServer,
    useFetchAdminEggForServer,
    useUpdateAdminServerStartup,
} from '@/api/admin/servers/queries';
import { serverStartupBodyFromFormValues, type ServerStartupValues } from '@/components/admin/servers/helpers';
import { type AdminEggListItem, useAdminEggs } from '@/api/admin/eggs/queries';
import { useServerDetail } from '@/components/admin/servers/useServerDetail';
import TagCheckAlert from '@/components/admin/tags/TagCheckAlert';
import { tagCheckError, type TagCheckMeta } from '@/components/admin/tags/helpers';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Label from '@/components/elements/Label';
import Code from '@/components/elements/Code';
import { TextInput } from '@/components/form/controls';
import { ServerError } from '@/components/elements/ScreenBlock';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { relationshipData } from '@/api/relationships';

interface Props {
    server: AdminServer;
}

interface Values {
    startup: string;
    eggId: number;
    image: string;
    customImage: string;
    skipScripts: boolean;
    environment: Record<string, string>;
}

const serverToValues = (server: AdminServer): Values => {
    const environment: Record<string, string> = {};

    for (const { attributes } of relationshipData(server.attributes.relationships?.variables)) {
        environment[attributes.env_variable] = attributes.server_value ?? attributes.default_value ?? '';
    }

    return {
        startup: server.attributes.container.startup_command,
        eggId: server.attributes.egg,
        image: server.attributes.container.image,
        customImage: '',
        skipScripts: server.attributes.container.skip_scripts,
        environment,
    };
};

const EnvironmentVariables = ({ form, egg }: { form: AppForm<Values, TagCheckMeta>; egg: EggForServer | null }) => {
    if (!egg) {
        return null;
    }

    const variables = relationshipData(egg.attributes.relationships?.variables);

    if (variables.length === 0) {
        return (
            <TitledGreyBox title='服务变量'>
                <Empty size='compact'>
                    <EmptyHeader>
                        <EmptyMedia variant='icon'>
                            <Variable />
                        </EmptyMedia>
                        <EmptyTitle>没有变量</EmptyTitle>
                        <EmptyDescription>此预设未定义任何环境变量。</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </TitledGreyBox>
        );
    }

    return (
        <div className='space-y-6'>
            {variables.map(({ attributes }) => (
                <TitledGreyBox key={attributes.id} title={attributes.name}>
                    <form.AppField name={`environment.${attributes.env_variable}`}>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id={`environment_${attributes.env_variable}`}
                                description={attributes.description}
                            />
                        )}
                    </form.AppField>
                    <div className='mt-3 text-xs text-muted-foreground space-y-1'>
                        <p>
                            <strong>启动变量：</strong> <Code>{attributes.env_variable}</Code>
                        </p>
                        {attributes.rules && (
                            <p>
                                <strong>输入规则：</strong> <Code className='break-all'>{attributes.rules}</Code>
                            </p>
                        )}
                    </div>
                </TitledGreyBox>
            ))}
        </div>
    );
};

const EggSelector = ({
    form,
    eggs,
    egg,
    loading,
    onEggChange,
}: {
    form: AppForm<Values, TagCheckMeta>;
    eggs: AdminEggListItem[];
    egg: EggForServer | null;
    loading: boolean;
    onEggChange: (eggId: number) => void;
}) => {
    const eggId = useStore(form.store, (state) => state.values.eggId);
    const image = useStore(form.store, (state) => state.values.image);

    const dockerImages = egg?.attributes.docker_images ?? {};
    const hasPresetImages = Object.keys(dockerImages).length > 0;
    const imageOptions = egg
        ? [
              ...Object.entries(dockerImages).map(([label, value]) => ({
                  value,
                  label: `${label} (${value})`,
              })),
              ...(hasPresetImages && !Object.values(dockerImages).includes(image)
                  ? [{ value: image, label: `${image} (custom)` }]
                  : []),
          ]
        : [];

    return (
        <>
            <TitledGreyBox title='服务配置'>
                <p className='text-xs text-destructive mb-4'>
                    修改下方任意数值都会导致服务器重装。服务器将先停止，然后继续执行。
                </p>
                <div>
                    <Label htmlFor='eggId'>预设</Label>
                    <Select
                        id='eggId'
                        value={eggId}
                        disabled={loading || eggs.length === 0}
                        options={eggs.map((candidate) => ({
                            value: candidate.attributes.id,
                            label: candidate.attributes.name,
                        }))}
                        onChange={(value) => {
                            const nextEggId = Number(value);

                            form.setFieldValue('eggId', nextEggId);
                            onEggChange(nextEggId);
                        }}
                    />
                </div>
                <div className='mt-6'>
                    <form.AppField name='skipScripts'>
                        {(field) => (
                            <field.SwitchField label='跳过预设安装脚本' description='重装服务器时跳过预设安装脚本。' />
                        )}
                    </form.AppField>
                </div>
            </TitledGreyBox>
            <TitledGreyBox title='Docker 镜像配置' className='mt-6'>
                {hasPresetImages ? (
                    <>
                        <Label htmlFor='image'>镜像</Label>
                        <Select
                            id='image'
                            value={image}
                            options={imageOptions}
                            onChange={(value) => {
                                form.setFieldValue('image', String(value));
                                form.setFieldValue('customImage', '');
                            }}
                        />
                        <div className='mt-6'>
                            <form.AppField name='customImage'>
                                {(field) => (
                                    <field.TextField
                                        type='text'
                                        id='custom_docker_image'
                                        label='自定义 Docker 镜像'
                                        placeholder='或输入自定义镜像...'
                                    />
                                )}
                            </form.AppField>
                        </div>
                    </>
                ) : (
                    <form.AppField name='image'>
                        {(field) => (
                            <field.TextField type='text' id='image' label='镜像' placeholder='输入 Docker 镜像...' />
                        )}
                    </form.AppField>
                )}
                <p className='mt-1 text-xs text-muted-foreground'>从下拉列表中选择镜像，或输入自定义 Docker 镜像。</p>
            </TitledGreyBox>
        </>
    );
};

function ServerStartupTabContent({ server }: Props) {
    const fetchEggForServer = useFetchAdminEggForServer();
    const updateServerStartup = useUpdateAdminServerStartup();

    const { data: eggs } = useAdminEggs();
    const [rejection, setRejection] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: serverToValues(server),
        onSubmitMeta: { ignoreTags: false },
        onSubmit: async ({ value, meta }) => {
            const payload: ServerStartupValues = {
                startup: value.startup,
                eggId: Number(value.eggId),
                image: value.customImage.trim() || value.image,
                skipScripts: value.skipScripts,
                environment: value.environment,
            };

            try {
                await updateServerStartup.mutateAsync(
                    updateAdminServerStartupInput(server.attributes.id, {
                        ...serverStartupBodyFromFormValues(payload),
                        ignore_tags: meta.ignoreTags,
                    })
                );
                setRejection(null);
            } catch (error) {
                setRejection(tagCheckError(error, 'egg_id'));
            }
        },
    });
    const eggId = useStore(form.store, (state) => Number(state.values.eggId));
    const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
    const { data: egg = null, isFetching: loadingEgg } = useAdminEggForServer(eggId);
    const latestEggLoad = useRef(0);

    const loadEgg = async (nextEggId: number) => {
        const eggLoad = ++latestEggLoad.current;

        setRejection(null);

        if (nextEggId <= 0) {
            form.setFieldValue('environment', {});
            form.setFieldValue('image', '');
            form.setFieldValue('customImage', '');

            return;
        }

        const nextEgg = await fetchEggForServer(nextEggId);

        if (eggLoad !== latestEggLoad.current) {
            return;
        }

        if (!nextEgg) {
            form.setFieldValue('environment', {});
            form.setFieldValue('image', '');
            form.setFieldValue('customImage', '');

            return;
        }

        const isCurrentEgg = nextEggId === server.attributes.egg;
        const current = relationshipData(server.attributes.relationships?.variables);
        const environment: Record<string, string> = {};

        for (const { attributes } of relationshipData(nextEgg.attributes.relationships?.variables)) {
            const existing = current.find((variable) => variable.attributes.env_variable === attributes.env_variable);

            environment[attributes.env_variable] =
                isCurrentEgg && existing
                    ? (existing.attributes.server_value ?? existing.attributes.default_value ?? '')
                    : attributes.default_value;
        }

        form.setFieldValue('environment', environment);

        const images = Object.values(nextEgg.attributes.docker_images);

        if (isCurrentEgg) {
            form.setFieldValue('image', server.attributes.container.image);
        } else if (images.length > 0) {
            form.setFieldValue('image', images[0]);
        }

        form.setFieldValue('customImage', '');
    };

    return (
        <Form form={form}>
            <TitledGreyBox title='启动命令修改'>
                <form.AppField name='startup'>
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='startup'
                            label='启动命令'
                            description='默认可用以下变量：{{SERVER_MEMORY}}、{{SERVER_IP}} 和 {{SERVER_PORT}}。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6'>
                    <Label htmlFor='default_startup'>默认服务启动命令</Label>
                    <TextInput
                        id='default_startup'
                        type='text'
                        readOnly
                        value={egg?.attributes.startup || '未定义启动命令'}
                    />
                </div>
            </TitledGreyBox>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
                <div>
                    <EggSelector
                        form={form}
                        eggs={eggs?.data ?? []}
                        egg={egg}
                        loading={loadingEgg}
                        onEggChange={(nextEggId) => void loadEgg(nextEggId)}
                    />
                </div>
                <EnvironmentVariables form={form} egg={egg} />
            </div>
            {rejection && (
                <div className='mt-6'>
                    <TagCheckAlert
                        message={rejection}
                        action='仍然更改'
                        pending={isSubmitting}
                        onAction={() => void form.handleSubmit({ ignoreTags: true })}
                    />
                </div>
            )}
            <div className='flex justify-end mt-6'>
                <form.AppForm>
                    <form.SubmitButton>保存修改</form.SubmitButton>
                </form.AppForm>
            </div>
        </Form>
    );
}

export default function ServerStartupTab() {
    const { server } = useServerDetail();

    if (server.attributes.container.installed !== 1) {
        return <ServerError message='由于当前安装状态，不允许访问此资源。' />;
    }

    return <ServerStartupTabContent key={server.attributes.id} server={server} />;
}
