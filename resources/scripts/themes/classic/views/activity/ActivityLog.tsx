import { History, ListFilter, XCircle } from 'lucide-react';
import {
    Alert,
    ButtonStyle,
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    NewButton,
    PaginationFooter,
    Select,
    Spinner,
    type ActivityLogModel,
    type ActivityScope,
} from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import ActivityLogEntry from './ActivityLogEntry';

const emptyMessages = {
    account: '您账户上执行的操作将显示在这里。',
    server: '此服务器上执行的操作将显示在这里。',
    admin: '通过管理面板执行的操作将显示在这里。',
} satisfies Record<ActivityScope, string>;

function Results({ model, filtered }: { model: ActivityLogModel; filtered: boolean }) {
    if (model.loading) {
        return <Spinner centered />;
    }

    if (model.entries.length) {
        return (
            <div className='bg-card'>
                {model.entries.map((entry) => (
                    <ActivityLogEntry key={entry.id} entry={entry} />
                ))}
            </div>
        );
    }

    return (
        <Empty className='border bg-card'>
            <EmptyHeader>
                <EmptyMedia variant='icon'>{filtered ? <ListFilter /> : <History />}</EmptyMedia>
                <EmptyTitle>{filtered ? '没有匹配的活动' : '暂无活动'}</EmptyTitle>
                <EmptyDescription>
                    {filtered ? '没有活动匹配所选筛选条件。' : emptyMessages[model.scope]}
                </EmptyDescription>
            </EmptyHeader>
            {filtered && (
                <EmptyContent>
                    <NewButton isSecondary icon={XCircle} onClick={model.actions.clearFilters}>
                        清除筛选
                    </NewButton>
                </EmptyContent>
            )}
        </Empty>
    );
}

function Filters({ model, filtered }: { model: ActivityLogModel; filtered: boolean }) {
    const { actions } = model;

    return (
        <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-stretch'>
            {model.users && (
                <div className='w-full sm:max-w-xs'>
                    <Select
                        options={[{ value: '', label: '所有用户' }, ...model.users]}
                        value={model.user ?? ''}
                        placeholder='所有用户'
                        searchPlaceholder='搜索用户…'
                        emptyMessage='尚无用户在此操作。'
                        onChange={(value) => actions.setUser(String(value) || null)}
                    />
                </div>
            )}
            <div className='w-full sm:max-w-sm'>
                <Select
                    groups={[
                        { label: '', options: [{ value: '', label: '所有事件' }] },
                        ...model.events.map((group) => ({ label: group.label, options: [...group.options] })),
                    ]}
                    value={model.event ?? ''}
                    placeholder='所有事件'
                    searchPlaceholder='搜索事件…'
                    emptyMessage='这里尚未记录任何内容。'
                    onChange={(value) => actions.setEvent(String(value) || null)}
                />
            </div>
            {filtered && (
                <ButtonStyle
                    type='button'
                    color='grey'
                    className='inline-flex items-center justify-center w-full sm:w-auto sm:shrink-0 h-auto'
                    onClick={actions.clearFilters}
                >
                    清除筛选 <XCircle className='w-4 h-4 ml-2' />
                </ButtonStyle>
            )}
        </div>
    );
}

export default function ActivityLog({ model, className }: ViewProps<'activity.log'>) {
    const filtered = model.event !== null || model.user !== null;

    return (
        <div className={className}>
            {model.error !== null && (
                <div className='mb-4 space-y-3'>
                    <Alert type='danger'>{model.error}</Alert>
                    <ButtonStyle type='button' color='grey' onClick={model.retry}>
                        重试
                    </ButtonStyle>
                </div>
            )}
            <Filters model={model} filtered={filtered} />
            <Results model={model} filtered={filtered} />
            {model.pagination && (
                <PaginationFooter pagination={model.pagination} onPageSelect={model.actions.setPage} />
            )}
        </div>
    );
}
