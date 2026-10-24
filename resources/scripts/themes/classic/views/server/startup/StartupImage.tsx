import { Input, InputSpinner, Select, TitledGreyBox } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function StartupImage({ model, className }: ViewProps<'server.startup.image'>) {
    return (
        <TitledGreyBox title='Docker 镜像' className={className}>
            {model.images.length > 1 && !model.custom ? (
                <>
                    <InputSpinner visible={model.pending}>
                        <Select
                            disabled={model.images.length < 2}
                            value={model.image}
                            onChange={(value) => void model.select(String(value)).catch(() => {})}
                            options={model.images.map(({ label, value }) => ({ value, label }))}
                        />
                    </InputSpinner>
                    <p className='text-xs text-muted-foreground mt-2'>
                        这是一项高级功能，可让您选择运行此服务器实例时使用的 Docker 镜像。
                    </p>
                </>
            ) : (
                <>
                    <Input disabled readOnly value={model.image} />
                    {model.custom && (
                        <p className='text-xs text-muted-foreground mt-2'>
                            此服务器的 Docker 镜像已由管理员手动设置，无法通过此界面更改。
                        </p>
                    )}
                </>
            )}
        </TitledGreyBox>
    );
}
