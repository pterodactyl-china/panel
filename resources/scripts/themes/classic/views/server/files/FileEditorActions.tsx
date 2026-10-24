import { Button, cn } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function FileEditorActions({ model, className }: ViewProps<'server.files.editor.actions'>) {
    return model.readOnly ? null : (
        <Button
            className={cn('w-full sm:w-auto', className)}
            disabled={model.saving}
            isLoading={model.saving}
            onClick={() => void model.save()}
        >
            {model.isNew ? '创建文件' : '保存内容'}
        </Button>
    );
}
