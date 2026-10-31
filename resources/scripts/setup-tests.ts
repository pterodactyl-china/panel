import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { toast } from 'sonner';
import { classicSkins } from '@/themes/classic/skins';
import { registerSkins } from '@/themes/skins';

// The panel registers classic before its first render; components under test render without booting.
registerSkins('classic', classicSkins);

// sonner 的提示在关闭前会排入定时器，用例结束后环境销毁再触发就会报
// "window is not defined"。每个用例结束前清空队列，避免这类未捕获异常。
afterEach(() => {
    toast.dismiss();
});
