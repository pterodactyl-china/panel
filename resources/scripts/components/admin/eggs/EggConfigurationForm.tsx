import React from 'react';
import type { AppForm } from '@/components/form';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Label from '@/components/elements/Label';
import type { CodemirrorEditorHandle } from '@/components/elements/LazyCodemirrorEditor';
import CodemirrorEditor from '@/components/elements/LazyCodemirrorEditor';
import type { AdminEggListItem } from '@/api/admin/eggs/queries';
import type { EggFormValues } from '@/components/admin/eggs/helpers';

export type EggForm = AppForm<EggFormValues>;

const validateEggName = (value: string): string | undefined => {
    if (value.length < 1) {
        return '必须提供预设名称。';
    }

    if (value.length > 191) {
        return '预设名称不得超过 191 个字符。';
    }

    return undefined;
};

const EggJsonField = ({
    label,
    description,
    initialContent,
    editorRef,
}: {
    label: string;
    description: string;
    initialContent: string;
    editorRef: React.RefObject<CodemirrorEditorHandle | null>;
}) => (
    <div>
        <Label>{label}</Label>
        <CodemirrorEditor
            ref={editorRef}
            mode='application/json'
            initialContent={initialContent}
            className='h-72'
            onContentSaved={() => {}}
        />
        <p className='input-help'>{description}</p>
    </div>
);

interface Props {
    form: EggForm;
    eggs: AdminEggListItem[];
    initialConfigLogs: string;
    initialConfigFiles: string;
    initialConfigStartup: string;
    logRef: React.RefObject<CodemirrorEditorHandle | null>;
    filesRef: React.RefObject<CodemirrorEditorHandle | null>;
    startupRef: React.RefObject<CodemirrorEditorHandle | null>;
}

const EggConfigurationFields = ({
    form,
    eggs,
    initialConfigLogs,
    initialConfigFiles,
    initialConfigStartup,
    logRef,
    filesRef,
    startupRef,
}: Props) => (
    <div className='space-y-4'>
        <TitledGreyBox title='配置'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-4'>
                    <form.AppField
                        name='name'
                        validators={{
                            onChange: ({ value }) => validateEggName(value),
                        }}
                    >
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='name'
                                label='名称'
                                description='用于标识此预设的简短名称，用户会看到它作为游戏服务端类型。'
                            />
                        )}
                    </form.AppField>
                    <form.AppField name='description'>
                        {(field) => (
                            <field.TextAreaField id='description' label='描述' rows={6} description='此预设的描述。' />
                        )}
                    </form.AppField>
                    <form.AppField name='forceOutgoingIp'>
                        {(field) => (
                            <field.SwitchField
                                label='强制出站 IP'
                                description='强制将所有出站流量的源 IP 通过 NAT 转换为该服务器主分配的 IP。启用后将禁用使用此预设的服务器的内部网络。'
                            />
                        )}
                    </form.AppField>
                </div>
                <div className='space-y-4'>
                    <form.AppField
                        name='dockerImages'
                        validators={{
                            onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供至少一个 Docker 镜像。'),
                        }}
                    >
                        {(field) => (
                            <field.TextAreaField
                                id='dockerImages'
                                label='Docker 镜像'
                                rows={4}
                                placeholder='ghcr.io/pterodactyl/yolks:debian'
                                description='可供使用此预设的服务器使用的 Docker 镜像，每行一个。可通过「显示名称|镜像地址」的格式为镜像指定显示名称。'
                            />
                        )}
                    </form.AppField>
                    <form.AppField
                        name='startup'
                        validators={{
                            onChange: ({ value }) => (value.length >= 1 ? undefined : '必须提供启动命令。'),
                        }}
                    >
                        {(field) => (
                            <field.TextAreaField
                                id='startup'
                                label='启动命令'
                                rows={8}
                                description='使用此预设创建的新服务器将默认使用的启动命令。'
                            />
                        )}
                    </form.AppField>
                    <form.AppField name='featuresText'>
                        {(field) => (
                            <field.TextField
                                type='text'
                                id='featuresText'
                                label='特性'
                                description='此预设所属的附加特性，以逗号分隔。可用于配置额外的面板修改项。'
                            />
                        )}
                    </form.AppField>
                </div>
            </div>
        </TitledGreyBox>

        <TitledGreyBox title='进程管理'>
            <p className='text-xs text-warning mb-4'>
                除非您了解此系统的运作方式，否则不应修改这些选项。所有字段均为必填，除非您从「从以下预设复制设置」下拉中选择了预设，此时进程相关字段可以留空以继承该预设的配置。
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <form.AppField name='configFrom'>
                    {(field) => (
                        <field.SelectField
                            id='configFrom'
                            label='从以下预设复制设置'
                            description='默认使用其他预设的进程设置。'
                            options={[
                                { value: 0, label: '无' },
                                ...eggs.map((egg) => ({
                                    value: egg.attributes.id,
                                    label: `${egg.attributes.name} <${egg.attributes.author}>`,
                                })),
                            ]}
                        />
                    )}
                </form.AppField>
                <form.AppField name='configStop'>
                    {(field) => (
                        <field.TextField
                            type='text'
                            id='configStop'
                            label='停止命令'
                            description='发送给服务器进程以正常停止的命令。要发送 SIGINT 请输入 ^C。'
                        />
                    )}
                </form.AppField>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <EggJsonField
                    label='日志配置'
                    description='以 JSON 描述日志文件的存放位置，以及守护进程是否应创建自定义日志。留空则从所选父预设继承此部分。'
                    initialContent={initialConfigLogs}
                    editorRef={logRef}
                />
                <EggJsonField
                    label='配置文件'
                    description='以 JSON 描述要修改的配置文件以及需要变更的部分。留空则从所选父预设继承此部分。'
                    initialContent={initialConfigFiles}
                    editorRef={filesRef}
                />
                <EggJsonField
                    label='启动配置'
                    description='以 JSON 描述守护进程在启动服务器时用于判断是否启动完成的值。留空则从所选父预设继承此部分。'
                    initialContent={initialConfigStartup}
                    editorRef={startupRef}
                />
            </div>
        </TitledGreyBox>
    </div>
);

export default EggConfigurationFields;
