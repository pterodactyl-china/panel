import type * as React from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { NewButton } from '@/components/elements/NewButton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

interface Props {
    icon: LucideIcon;
    /** Plural, lower-case resource name, e.g. "servers". */
    noun: string;
    filter?: string;
    onClearFilter: () => void;
    description: React.ReactNode;
    action?: React.ReactNode;
}

/** 可搜索管理列表的空状态：「暂无结果」，或带返回入口的「没有匹配的服务器」。 */
export default function AdminListEmpty({
    icon: ResourceIcon,
    noun,
    filter,
    onClearFilter,
    description,
    action,
}: Props) {
    const content = filter ? (
        <NewButton isSecondary icon={X} onClick={onClearFilter}>
            清除搜索
        </NewButton>
    ) : (
        action
    );

    return (
        <Empty size='compact'>
            <EmptyHeader>
                <EmptyMedia variant='icon'>
                    <ResourceIcon />
                </EmptyMedia>
                <EmptyTitle>{filter ? `没有匹配的${noun}` : `暂无${noun}`}</EmptyTitle>
                <EmptyDescription>
                    {filter ? (
                        <>
                            没有找到与 <span className='font-medium text-foreground'>{filter}</span> 匹配的{noun}。
                        </>
                    ) : (
                        description
                    )}
                </EmptyDescription>
            </EmptyHeader>
            {content && <EmptyContent>{content}</EmptyContent>}
        </Empty>
    );
}
