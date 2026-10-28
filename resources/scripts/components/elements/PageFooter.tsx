import { replaceable, useSkin } from '@/themes/skins';

export interface PageFooterProps {
    className?: string;
}

/** The copyright line below each page's content. Replace it with a component that renders nothing to drop it. */
function CorePageFooter({ className }: PageFooterProps) {
    const ui = useSkin('PageFooter', {});

    return (
        <div {...ui('root', className)}>
            <p {...ui('text')}>
                <a rel='noopener nofollow noreferrer' href='https://pterodactyl.io' target='_blank' {...ui('link')}>
                    Pterodactyl Software
                </a>
                &nbsp;&copy; 2015 - <span suppressHydrationWarning>{new Date().getFullYear()}</span>
                &nbsp;| Sinicizated by&nbsp;
                <a rel='noopener nofollow noreferrer' href='https://pterodactyl.top' target='_blank' {...ui('link')}>
                    翼龙中国&reg;
                </a>
            </p>
        </div>
    );
}

const PageFooter = replaceable('PageFooter', CorePageFooter);

export default PageFooter;
