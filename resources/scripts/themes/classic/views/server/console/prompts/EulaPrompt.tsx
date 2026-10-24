import { Button, Dialog, SpinnerOverlay } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { cancelClass } from './parts';

export default function EulaPrompt({ model }: ViewProps<'server.feature.eula'>) {
    return (
        <Dialog
            open={model.open}
            title={<>接受 Minecraft&reg; EULA</>}
            onClose={model.close}
            preventExternalClose={model.pending}
            hideCloseIcon={model.pending}
        >
            <SpinnerOverlay visible={model.pending} />
            <p className='text-foreground'>
                按下方的「我接受」按钮，即表示您同意以下&nbsp;
                <a
                    target='_blank'
                    className='text-accent underline transition-colors duration-150 hover:text-accent/80'
                    rel='noreferrer noopener'
                    href='https://www.minecraft.net/eula'
                >
                    Minecraft&reg; EULA
                </a>
                .
            </p>
            <div className='mt-8 sm:flex items-center justify-end'>
                <Button isSecondary onClick={model.close} className={cancelClass}>
                    取消
                </Button>
                <Button
                    onClick={() => void model.accept().catch(() => {})}
                    className='mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto'
                >
                    我接受
                </Button>
            </div>
        </Dialog>
    );
}
