import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/components/App';
import { queryClient } from '@/api/queryClient';
import { syncThemeColorMeta } from '@/lib/theme';
import { bootTheme } from '@/views/boot';
import '@/router/view-transitions.css';
import { followCurrentUserLanguage } from './i18n';

// 这条信息你不可以将之删除，一是记录了版本信息，二是为了原项目指向，
// 如果你将之删除，那你需要承担相应的责任。否则请不要使用我们的汉化！
const version = document.querySelector('meta[name="app-version"]')?.getAttribute('content') ?? 'unknown';

// 控制台徽章的样式是 CSS 字符串，无法使用主题 token，这里豁免设计规范检查。
// oxlint-disable rules/design-tokens -- 控制台样式需要固定色值
console.log(
    '\n %c pterodactyl-china ' + `%c https://github.com/pterodactyl-china/panel %c v${version} \n\n`,
    'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
    'background: #fadfa3; padding: 1px; color: #fff',
    'background: #41b883; padding: 1px; border-radius: 0 3px 3px 0; color: #fff'
);
// oxlint-enable rules/design-tokens

followCurrentUserLanguage(queryClient);
syncThemeColorMeta();

const container = document.getElementById('app');

if (container) {
    const root = createRoot(container);

    // Not a top-level await: one in the entry turns off the bundler's chunk merging for the whole build.
    void bootTheme().then(() =>
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        )
    );
}
