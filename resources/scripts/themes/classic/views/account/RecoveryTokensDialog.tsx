import { Alert, Button, CopyOnClick, Dialog } from '@/sdk';

export default function RecoveryTokensDialog({ tokens, onClose }: { tokens: readonly string[]; onClose: () => void }) {
    const grouped: [string, string][] = [];

    for (const [index, token] of tokens.entries()) {
        if (index % 2 === 0) {
            grouped.push([token, tokens[index + 1] || '']);
        }
    }

    return (
        <Dialog
            open={tokens.length > 0}
            onClose={onClose}
            title='两步验证已启用'
            description='请将这些恢复代码妥善保存。如果无法使用手机，可使用这些备用代码登录。'
            hideCloseIcon
            preventExternalClose
        >
            <Dialog.Icon position='container' type='success' />
            <CopyOnClick text={tokens.join('\n')} showInNotification={false}>
                <pre className='bg-background rounded-sm p-2 mt-6'>
                    {grouped.map((value) => (
                        <span key={value.join('_')} className='block'>
                            {value[0]}
                            <span className='mx-2 selection:bg-background'>&nbsp;</span>
                            {value[1]}
                            <span className='selection:bg-background'>&nbsp;</span>
                        </span>
                    ))}
                </pre>
            </CopyOnClick>
            <Alert type='danger' className='mt-3'>
                这些代码不会再次显示。
            </Alert>
            <Dialog.Footer>
                <Button.Text onClick={onClose}>完成</Button.Text>
            </Dialog.Footer>
        </Dialog>
    );
}
