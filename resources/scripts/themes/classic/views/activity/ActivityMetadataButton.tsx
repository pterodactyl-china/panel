import { ClipboardList } from 'lucide-react';
import { Button, Dialog, type ActivityProperties } from '@/sdk';

export default function ActivityMetadataButton({ meta }: { meta: ActivityProperties }) {
    return (
        <div className='self-center md:px-4'>
            <Dialog.Trigger
                trigger={({ onClick }) => (
                    <button
                        type='button'
                        aria-label='查看事件附加元数据'
                        className='p-2 transition-colors duration-100 text-muted-foreground group-hover:text-muted-foreground hover:group-hover:text-foreground'
                        onClick={onClick}
                    >
                        <ClipboardList className='w-5 h-5' />
                    </button>
                )}
            >
                {({ open, onClose }) => (
                    <Dialog open={open} onClose={onClose} hideCloseIcon title='元数据'>
                        <pre className='bg-muted rounded-sm p-2 font-mono text-sm leading-relaxed overflow-x-scroll whitespace-pre-wrap'>
                            {JSON.stringify(meta, null, 2)}
                        </pre>
                        <Dialog.Footer>
                            <Button.Text onClick={onClose}>关闭</Button.Text>
                        </Dialog.Footer>
                    </Dialog>
                )}
            </Dialog.Trigger>
        </div>
    );
}
