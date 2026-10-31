import { Search as SearchIcon, SearchX } from 'lucide-react';
import {
    Alert,
    cn,
    Dialog,
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    Icon,
    InputSpinner,
    PanelLink,
    Tooltip,
} from '@/sdk';
import type { AppSearchModel, ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';

const resultClass = [
    'flex items-center bg-muted p-4 rounded-sm border-l-4 border-border no-underline transition-[background-color,border-color,color] duration-150',
    'hover:shadow-sm hover:border-accent',
    'not-last-of-type:mb-2',
].join(' ');

function Results({ model }: { model: AppSearchModel }) {
    if (model.error) {
        return (
            <div className='mt-4'>
                <Alert type='danger'>{model.error}</Alert>
            </div>
        );
    }

    if (model.searched && model.results.length === 0) {
        return (
            <Empty size='compact' className='mt-6'>
                <EmptyHeader>
                    <EmptyMedia variant='icon'>
                        <SearchX />
                    </EmptyMedia>
                    <EmptyTitle>未找到服务器</EmptyTitle>
                    <EmptyDescription>没有服务器匹配您的搜索。请尝试其他名称或地址。</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return model.results.length > 0 ? (
        <div className='mt-6'>
            {model.results.map((result) => (
                <PanelLink
                    key={result.uuid}
                    destination={result.destination}
                    className={resultClass}
                    onClick={model.close}
                >
                    <div className='flex-1 mr-4'>
                        <p className='text-sm'>{result.name}</p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                            {result.addresses.map((address) => (
                                <span key={address}>{address}</span>
                            ))}
                        </p>
                    </div>
                    <div className='flex-none text-right'>
                        <span className='text-xs py-1 px-2 bg-accent text-accent-foreground rounded-sm'>
                            {result.node}
                        </span>
                    </div>
                </PanelLink>
            ))}
        </div>
    ) : null;
}

export default function Search({ model, className }: ViewProps<'app.search'>) {
    return (
        <>
            {model.open && (
                <Dialog title='搜索服务器' open onClose={model.close}>
                    <form noValidate onSubmit={(event) => event.preventDefault()}>
                        <InputSpinner visible={model.loading}>
                            <TextField
                                field={model.field}
                                label='搜索词'
                                description='输入服务器名称、UUID 或端口地址开始搜索。'
                                autoFocus
                            />
                        </InputSpinner>
                    </form>
                    <Results model={model} />
                </Dialog>
            )}
            <Tooltip placement='bottom' content='搜索'>
                <button
                    type='button'
                    aria-label='搜索'
                    aria-keyshortcuts={model.shortcut.aria}
                    className={cn('navigation-link', className)}
                    onClick={model.show}
                >
                    <Icon icon={SearchIcon} />
                </button>
            </Tooltip>
        </>
    );
}
