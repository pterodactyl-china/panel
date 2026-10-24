import type { AdminNode, NodeValues } from '@/api/admin/nodes/queries';
import { type NumberInputValue, requiredNumber, submittedNumber } from '@/components/admin/numberInput';
import { initialExtensionValues } from '@/extensions/forms';

export interface NodeFormValues extends Omit<
    NodeValues,
    'memory' | 'memoryOverallocate' | 'disk' | 'diskOverallocate' | 'uploadSize' | 'daemonListen' | 'daemonSftp'
> {
    memory: NumberInputValue;
    memoryOverallocate: NumberInputValue;
    disk: NumberInputValue;
    diskOverallocate: NumberInputValue;
    uploadSize: NumberInputValue;
    daemonListen: NumberInputValue;
    daemonSftp: NumberInputValue;
}

export const newNodeFormValues = (): NodeFormValues => ({
    name: '',
    description: '',
    locationId: 0,
    public: true,
    fqdn: '',
    scheme: 'https',
    behindProxy: false,
    maintenanceMode: false,
    memory: 1024,
    memoryOverallocate: 0,
    disk: 10240,
    diskOverallocate: 0,
    uploadSize: 100,
    daemonListen: 8080,
    daemonSftp: 2022,
    daemonBase: '/var/lib/pterodactyl/volumes',
    extensions: initialExtensionValues(),
});

export const nodeFormValues = (node: AdminNode): NodeFormValues => ({
    name: node.attributes.name,
    description: node.attributes.description ?? '',
    locationId: node.attributes.location_id,
    public: node.attributes.public,
    fqdn: node.attributes.fqdn,
    scheme: node.attributes.scheme,
    behindProxy: node.attributes.behind_proxy,
    maintenanceMode: node.attributes.maintenance_mode,
    memory: node.attributes.memory,
    memoryOverallocate: node.attributes.memory_overallocate,
    disk: node.attributes.disk,
    diskOverallocate: node.attributes.disk_overallocate,
    uploadSize: node.attributes.upload_size,
    daemonListen: node.attributes.daemon_listen,
    daemonSftp: node.attributes.daemon_sftp,
    daemonBase: node.attributes.daemon_base,
    extensions: initialExtensionValues(),
});

export const nodeValuesFromForm = ({
    memory,
    memoryOverallocate,
    disk,
    diskOverallocate,
    uploadSize,
    daemonListen,
    daemonSftp,
    ...values
}: NodeFormValues): NodeValues => ({
    ...values,
    memory: submittedNumber(memory),
    memoryOverallocate: submittedNumber(memoryOverallocate),
    disk: submittedNumber(disk),
    diskOverallocate: submittedNumber(diskOverallocate),
    uploadSize: submittedNumber(uploadSize),
    daemonListen: submittedNumber(daemonListen),
    daemonSftp: submittedNumber(daemonSftp),
});

export const validateNodeName = (value: string): string | undefined => {
    if (value.length < 1) {
        return '必须提供名称。';
    }

    if (value.length > 100) {
        return '名称不得超过 100 个字符。';
    }

    return undefined;
};

export const nodeNumberValidators = {
    memory: {
        onChange: requiredNumber('必须提供内存限制。', (value) => (value >= 1 ? undefined : '必须提供内存限制。')),
    },
    memoryOverallocate: { onChange: requiredNumber('必须提供内存超额分配。') },
    disk: {
        onChange: requiredNumber('必须提供磁盘限制。', (value) => (value >= 1 ? undefined : '必须提供磁盘限制。')),
    },
    diskOverallocate: { onChange: requiredNumber('必须提供磁盘超额分配。') },
    uploadSize: { onChange: requiredNumber('必须提供上传大小限制。') },
    daemonListen: { onChange: requiredNumber('必须提供守护进程端口。') },
    daemonSftp: { onChange: requiredNumber('必须提供守护进程 SFTP 端口。') },
};
