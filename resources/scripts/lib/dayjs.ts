import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

// Import dayjs from this module so these plugins are registered.
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
// 面板面向中文用户，相对时间（5 分钟前、2 天前）与日期格式统一使用简体中文。
dayjs.locale('zh-cn');

export default dayjs;
