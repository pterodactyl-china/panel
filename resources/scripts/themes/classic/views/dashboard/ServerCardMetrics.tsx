import { Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { Badge, bytesToString, cn, Spinner, Stat } from '@/sdk';
import type { ServerCardState, ServerStatMetric, ServerUnavailableReason, UiTone, ViewProps } from '@/sdk/theme';

const unavailableLabels = {
    suspended: 'Suspended',
    'connection-error': '连接错误',
    maintenance: '维护中',
    transferring: 'Transferring',
    installing: '安装中',
    'restoring-backup': '正在恢复备份',
    unavailable: '不可用',
} as const;

const unavailableTones = {
    suspended: 'danger',
    'connection-error': 'danger',
    maintenance: 'warning',
    transferring: 'neutral',
    installing: 'neutral',
    'restoring-backup': 'neutral',
    unavailable: 'neutral',
} satisfies Record<ServerUnavailableReason, UiTone>;

function UnavailableBadge({ reason }: { reason: ServerUnavailableReason }) {
    return (
        <div className='flex-1 text-center'>
            <Badge tone={unavailableTones[reason]}>{unavailableLabels[reason]}</Badge>
        </div>
    );
}

// The card shows only the danger alarm; a warning draws like no alarm.
const tone = ({ alarm }: ServerStatMetric): UiTone => (alarm === 'danger' ? 'danger' : 'neutral');

function MetricsContent({ state }: { state: ServerCardState }) {
    if (state.kind === 'loading') {
        return <Spinner size='small' />;
    }

    if (state.kind === 'unavailable') {
        return <UnavailableBadge reason={state.reason} />;
    }

    return (
        <>
            {[
                {
                    label: 'CPU',
                    icon: Cpu,
                    metric: state.cpu,
                    value: `${state.cpu.value.toFixed(2)} %`,
                    limit: state.cpu.limit === 0 ? '无限制' : `${state.cpu.limit} %`,
                },
                {
                    label: '内存',
                    icon: MemoryStick,
                    metric: state.memory,
                    value: bytesToString(state.memory.value),
                    limit: state.memory.limit === 0 ? '无限制' : bytesToString(state.memory.limit),
                },
                {
                    label: '磁盘',
                    icon: HardDrive,
                    metric: state.disk,
                    value: bytesToString(state.disk.value),
                    limit: state.disk.limit === 0 ? '无限制' : bytesToString(state.disk.limit),
                },
            ].map(({ label, icon, metric, value, limit }) => (
                <Stat
                    key={label}
                    variant='inline'
                    icon={icon}
                    label={label}
                    value={value}
                    limit={`上限 ${limit}`}
                    tone={tone(metric)}
                    className='flex-1 ml-4 hidden sm:flex'
                />
            ))}
        </>
    );
}

export default function ServerCardMetrics({ model, className }: ViewProps<'dashboard.serverCard.metrics'>) {
    return (
        <div className={cn('hidden col-span-7 lg:col-span-4 sm:flex items-baseline justify-center', className)}>
            <MetricsContent state={model.state} />
        </div>
    );
}
