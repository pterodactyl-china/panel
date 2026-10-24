import type { AdminDatabaseHost } from '@/api/admin/database-hosts/queries';
import { type NumberInputValue, requiredNumber, submittedNumber } from '@/components/admin/numberInput';
import { requiredWithMaxLength } from '@/components/form/validators';
import { type ExtensionFormValues, initialExtensionValues } from '@/extensions/forms';

export interface DatabaseHostFormValues {
    name: string;
    host: string;
    port: NumberInputValue;
    username: string;
    password: string;
    nodeId: string;
    extensions: ExtensionFormValues;
}

type TextValidator = ({ value }: { value: string }) => string | undefined;

export const newDatabaseHostFormValues = (): DatabaseHostFormValues => ({
    name: '',
    host: '',
    port: 3306,
    username: '',
    password: '',
    nodeId: '',
    extensions: initialExtensionValues(),
});

export const databaseHostFormValues = (host: AdminDatabaseHost): DatabaseHostFormValues => ({
    name: host.attributes.name,
    host: host.attributes.host,
    port: host.attributes.port,
    username: host.attributes.username,
    password: '',
    nodeId: host.attributes.node_id === null ? '' : String(host.attributes.node_id),
    extensions: initialExtensionValues(),
});

const validateName = requiredWithMaxLength(191, '必须提供名称。', '名称不得超过 191 个字符。');

const validateHost: TextValidator = ({ value }): string | undefined => {
    if (value.length < 1) {
        return '必须提供主机。';
    }

    if (!/^[\w\-.]+$/.test(value)) {
        return '主机必须是有效的主机名或 IP 地址。';
    }

    return undefined;
};

const validateUsername = requiredWithMaxLength(32, '必须提供用户名。', '用户名不得超过 32 个字符。');

const validateRequiredPassword: TextValidator = ({ value }) => (value.length >= 1 ? undefined : '必须提供密码。');

export const databaseHostValidators = {
    name: { onChange: validateName },
    host: { onChange: validateHost },
    port: {
        onChange: requiredNumber('必须提供端口。', (value) =>
            value >= 1 && value <= 65535 ? undefined : '端口必须介于 1 与 65535 之间。'
        ),
    },
    username: { onChange: validateUsername },
    requiredPassword: { onChange: validateRequiredPassword },
};

export const databaseHostBodyFromFormValues = (values: DatabaseHostFormValues) => ({
    name: values.name,
    host: values.host,
    port: submittedNumber(values.port),
    username: values.username,
    password: values.password || undefined,
    node_id: values.nodeId === '' ? null : Number(values.nodeId),
    extensions: values.extensions,
});
