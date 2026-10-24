import { cn } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

const codeClass = 'font-mono bg-muted rounded-sm py-px px-1';

export default function FileEditorNotice({ model, className }: ViewProps<'server.files.editor.notice'>) {
    return model.name.endsWith('.pteroignore') ? (
        <div className={cn('mb-4 p-4 border-l-4 bg-muted rounded-sm border-accent', className)}>
            <p className='text-muted-foreground text-sm'>
                您正在编辑 <code className={codeClass}>.pteroignore</code>{' '}
                文件。此处列出的文件和目录将被排除在备份之外。可使用星号（
                <code className={codeClass}>*</code>
                ）作为通配符。也可在规则前加感叹号（<code className={codeClass}>!</code>
                ）来取消先前的规则。
            </p>
        </div>
    ) : null;
}
