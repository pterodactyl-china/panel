import {
    Alert,
    Button,
    CopyOnClick,
    Dialog,
    Input,
    QrCode,
    Spinner,
    Tooltip,
    type AccountTwoFactorModel,
    type TwoFactorSetupModel,
} from '@/sdk';

function SecretQrCode({ setup }: { setup: TwoFactorSetupModel }) {
    if (setup.error) {
        return <span className='text-sm text-muted-foreground text-center'>无法加载二维码。</span>;
    }

    return setup.qrCode === null ? <Spinner /> : <QrCode value={setup.qrCode} className='w-full h-full shadow-none' />;
}

function SetupForm({ setup, onClose }: { setup: TwoFactorSetupModel; onClose: () => void }) {
    const { code, password } = setup.fields;
    const complete = password.fieldProps.value.length > 0 && code.fieldProps.value.length === 6;

    return (
        <form
            id='enable-totp-form'
            onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setup.submit();
            }}
        >
            <div className='flex items-center justify-center w-56 h-56 p-2 bg-card shadow-sm mx-auto mt-6'>
                <SecretQrCode setup={setup} />
            </div>
            <CopyOnClick text={setup.secret ?? undefined}>
                <p className='font-mono text-sm text-foreground text-center mt-2'>
                    {setup.secret?.match(/.{1,4}/g)?.join(' ') || 'Loading...'}
                </p>
            </CopyOnClick>
            {setup.error && (
                <div className='mt-4 space-y-3'>
                    <Alert type='danger'>{setup.error}</Alert>
                    <Button.Text type='button' onClick={setup.retry}>
                        重试
                    </Button.Text>
                </div>
            )}
            <p id='totp-code-description' className='mt-6'>
                使用您选择的两步验证应用扫描上方二维码，然后把生成的 6 位验证码填入下方字段。
            </p>
            <Input {...code.fieldProps} aria-labelledby='totp-code-description' className='mt-3' placeholder='000000' />
            <label htmlFor='totp-password' className='block mt-3'>
                账户密码
            </label>
            <Input {...password.fieldProps} id='totp-password' className='mt-1' />
            <Dialog.Footer>
                <Button.Text onClick={onClose}>取消</Button.Text>
                <Tooltip
                    disabled={complete}
                    content={setup.secret ? '必须输入 6 位验证码和密码才能继续。' : '正在等待二维码加载...'}
                    delay={100}
                >
                    <Button
                        disabled={!setup.canSubmit}
                        isLoading={setup.submitting}
                        type='submit'
                        form='enable-totp-form'
                    >
                        启用
                    </Button>
                </Tooltip>
            </Dialog.Footer>
        </form>
    );
}

export default function SetupTwoFactorDialog({ model }: { model: AccountTwoFactorModel }) {
    return (
        <Dialog
            open={model.dialog === 'enable'}
            onClose={model.closeDialog}
            preventExternalClose={model.setup.submitting}
            hideCloseIcon={model.setup.submitting}
            title='启用两步验证'
            description='保护您的账户免受未经授权的访问。每次登录时都会要求输入验证码。'
        >
            <SetupForm setup={model.setup} onClose={model.closeDialog} />
        </Dialog>
    );
}
