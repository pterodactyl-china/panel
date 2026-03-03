import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components/macro';
import Select from '@/components/elements/Select';
import tw from 'twin.macro';

type FrequencyType = 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly';

interface CronValues {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}

interface Props {
    initialCron?: CronValues;
    onChange: (values: CronValues) => void;
}

const range = (start: number, end: number): number[] => Array.from({ length: end - start + 1 }, (_, i) => start + i);

const MINUTE_INTERVALS = range(1, 59);
const HOUR_INTERVALS = range(1, 23);
const DAYS_OF_WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// ─── Drum / wheel picker ──────────────────────────────────────────────────────

const ITEM_HEIGHT = 36; // px — height of each row in the wheel
const SCROLL_THRESHOLD = 2; // px — tolerance to skip no-op smooth-scrolls
const SCROLL_DEBOUNCE_MS = 100; // ms — wait after last scroll event before snapping
const SCROLL_END_DELAY_MS = 250; // ms — how long after snapping before accepting external updates

// neutral-600 = hsl(209, 14%, 37%) — must match TimePickerBox background
const BG_COLOR = 'hsl(209, 14%, 37%)';

const WheelOuter = styled.div`
    position: relative;
    height: ${ITEM_HEIGHT * 3}px;
    width: 2.75rem;
    overflow: hidden;
    flex-shrink: 0;
    /* gradient fades that dissolve items into the background */
    &::before,
    &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: ${ITEM_HEIGHT}px;
        pointer-events: none;
        z-index: 2;
    }
    &::before {
        top: 0;
        background: linear-gradient(to bottom, ${BG_COLOR}, transparent);
    }
    &::after {
        bottom: 0;
        background: linear-gradient(to top, ${BG_COLOR}, transparent);
    }
`;

const WheelHighlight = styled.div`
    position: absolute;
    top: ${ITEM_HEIGHT}px;
    left: 0;
    right: 0;
    height: ${ITEM_HEIGHT}px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    pointer-events: none;
    z-index: 1;
`;

const WheelScroll = styled.ul`
    height: ${ITEM_HEIGHT * 3}px;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
    list-style: none;
    padding: ${ITEM_HEIGHT}px 0;
    margin: 0;
    &::-webkit-scrollbar {
        display: none;
    }
`;

const WheelItem = styled.li`
    height: ${ITEM_HEIGHT}px;
    line-height: ${ITEM_HEIGHT}px;
    text-align: center;
    scroll-snap-align: center;
    cursor: pointer;
    font-size: 0.875rem;
    user-select: none;
    ${tw`text-neutral-200`};
`;

interface WheelPickerProps {
    items: string[];
    /** selected index (= numeric value for 0-based sequences) */
    value: number;
    onChange: (index: number) => void;
}

const WheelPicker = ({ items, value, onChange }: WheelPickerProps) => {
    const listRef = useRef<HTMLUListElement>(null);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const endTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const userScrolling = useRef(false);
    const hasMounted = useRef(false);

    // On first render: jump directly (no animation). On subsequent value changes
    // from outside while the user is not scrolling: smooth-scroll to the new position.
    useEffect(() => {
        if (!listRef.current) return;
        if (!hasMounted.current) {
            listRef.current.scrollTop = value * ITEM_HEIGHT;
            hasMounted.current = true;
        } else if (!userScrolling.current) {
            const target = value * ITEM_HEIGHT;
            if (Math.abs(listRef.current.scrollTop - target) > SCROLL_THRESHOLD) {
                listRef.current.scrollTo({ top: target, behavior: 'smooth' });
            }
        }
    }, [value]);

    // Clean up pending timers on unmount to prevent setState after unmount.
    useEffect(
        () => () => {
            clearTimeout(scrollTimer.current);
            clearTimeout(endTimer.current);
        },
        []
    );

    const handleScroll = () => {
        userScrolling.current = true;
        clearTimeout(scrollTimer.current);
        scrollTimer.current = setTimeout(() => {
            scrollTimer.current = undefined;
            if (!listRef.current) return;
            const index = Math.round(listRef.current.scrollTop / ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(index, items.length - 1));
            // Snap to the nearest item
            listRef.current.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: 'smooth' });
            if (clamped !== value) onChange(clamped);
            clearTimeout(endTimer.current);
            endTimer.current = setTimeout(() => {
                endTimer.current = undefined;
                userScrolling.current = false;
            }, SCROLL_END_DELAY_MS);
        }, SCROLL_DEBOUNCE_MS);
    };

    return (
        <WheelOuter>
            <WheelHighlight />
            <WheelScroll ref={listRef} onScroll={handleScroll}>
                {items.map((item, i) => (
                    <WheelItem
                        key={item}
                        onClick={() => {
                            onChange(i);
                            listRef.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
                        }}
                    >
                        {item}
                    </WheelItem>
                ))}
            </WheelScroll>
        </WheelOuter>
    );
};

const TimePickerBox = styled.div`
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 0.5rem;
    ${tw`bg-neutral-600 border border-neutral-500 rounded`};
`;

const HOURS = range(0, 23).map((h) => String(h).padStart(2, '0'));
const MINS = range(0, 59).map((m) => String(m).padStart(2, '0'));

interface TimePickerProps {
    hour: number;
    minute: number;
    onHourChange: (h: number) => void;
    onMinuteChange: (m: number) => void;
}

/** HH:MM drum-wheel picker */
const TimePicker = ({ hour, minute, onHourChange, onMinuteChange }: TimePickerProps) => (
    <TimePickerBox>
        <WheelPicker items={HOURS} value={hour} onChange={onHourChange} />
        <span css={tw`text-neutral-300 text-sm font-semibold px-1 select-none`}>:</span>
        <WheelPicker items={MINS} value={minute} onChange={onMinuteChange} />
    </TimePickerBox>
);

const parseInitialState = (
    cron?: CronValues
): {
    frequency: FrequencyType;
    minuteInterval: number;
    hourInterval: number;
    hourOffset: number;
    dayHour: number;
    dayMinute: number;
    weekDay: number;
    weekHour: number;
    weekMinute: number;
    monthDay: number;
    monthHour: number;
    monthMinute: number;
} => {
    const defaults = {
        frequency: 'daily' as FrequencyType,
        minuteInterval: 5,
        hourInterval: 1,
        hourOffset: 0,
        dayHour: 0,
        dayMinute: 0,
        weekDay: 0,
        weekHour: 0,
        weekMinute: 0,
        monthDay: 1,
        monthHour: 0,
        monthMinute: 0,
    };
    if (!cron) return defaults;

    const minuteMatch = /^\*\/(\d+)$/.exec(cron.minute);
    const hourMatch = /^\*\/(\d+)$/.exec(cron.hour);

    // minutely: */X * * * *
    if (minuteMatch && cron.hour === '*' && cron.dayOfMonth === '*' && cron.month === '*' && cron.dayOfWeek === '*') {
        const interval = Number(minuteMatch[1]);
        return {
            ...defaults,
            frequency: 'minutely',
            minuteInterval: interval >= 1 && interval <= 59 ? interval : 5,
        };
    }

    // hourly: M */H * * * or M * * * *
    const hourNum = /^\d+$/.test(cron.hour) ? Number(cron.hour) : -1;
    const minuteNum = /^\d+$/.test(cron.minute) ? Number(cron.minute) : -1;
    if (
        minuteNum >= 0 &&
        (hourMatch || cron.hour === '*') &&
        cron.dayOfMonth === '*' &&
        cron.month === '*' &&
        cron.dayOfWeek === '*' &&
        hourNum < 0
    ) {
        const interval = hourMatch ? Number(hourMatch[1]) : 1;
        return {
            ...defaults,
            frequency: 'hourly',
            hourOffset: minuteNum,
            hourInterval: interval >= 1 && interval <= 23 ? interval : 1,
        };
    }

    const domNum = /^\d+$/.test(cron.dayOfMonth) ? Number(cron.dayOfMonth) : -1;
    const dowNum = /^\d+$/.test(cron.dayOfWeek) ? Number(cron.dayOfWeek) : -1;

    // monthly: M H D * *
    if (minuteNum >= 0 && hourNum >= 0 && domNum >= 1 && cron.month === '*' && cron.dayOfWeek === '*') {
        return {
            ...defaults,
            frequency: 'monthly',
            monthMinute: minuteNum,
            monthHour: hourNum,
            monthDay: domNum <= 31 ? domNum : 1,
        };
    }

    // weekly: M H * * DOW
    if (minuteNum >= 0 && hourNum >= 0 && cron.dayOfMonth === '*' && cron.month === '*' && dowNum >= 0) {
        return {
            ...defaults,
            frequency: 'weekly',
            weekMinute: minuteNum,
            weekHour: hourNum,
            weekDay: dowNum <= 6 ? dowNum : 0,
        };
    }

    // daily: M H * * *
    if (minuteNum >= 0 && hourNum >= 0 && cron.dayOfMonth === '*' && cron.month === '*' && cron.dayOfWeek === '*') {
        return { ...defaults, frequency: 'daily', dayMinute: minuteNum, dayHour: hourNum };
    }

    return defaults;
};

export default ({ initialCron, onChange }: Props) => {
    const init = parseInitialState(initialCron);
    const [frequency, setFrequency] = useState<FrequencyType>(init.frequency);
    const [minuteInterval, setMinuteInterval] = useState(init.minuteInterval);
    const [hourInterval, setHourInterval] = useState(init.hourInterval);
    const [hourOffset, setHourOffset] = useState(init.hourOffset);
    const [dayHour, setDayHour] = useState(init.dayHour);
    const [dayMinute, setDayMinute] = useState(init.dayMinute);
    const [weekDay, setWeekDay] = useState(init.weekDay);
    const [weekHour, setWeekHour] = useState(init.weekHour);
    const [weekMinute, setWeekMinute] = useState(init.weekMinute);
    const [monthDay, setMonthDay] = useState(init.monthDay);
    const [monthHour, setMonthHour] = useState(init.monthHour);
    const [monthMinute, setMonthMinute] = useState(init.monthMinute);

    // Use a ref so the effect doesn't need `onChange` as a dependency, avoiding
    // potential infinite update loops when an unstable callback reference is passed.
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    });

    useEffect(() => {
        let values: CronValues;
        switch (frequency) {
            case 'minutely':
                values = {
                    minute: `*/${minuteInterval}`,
                    hour: '*',
                    dayOfMonth: '*',
                    month: '*',
                    dayOfWeek: '*',
                };
                break;
            case 'hourly':
                values = {
                    minute: String(hourOffset),
                    hour: hourInterval === 1 ? '*' : `*/${hourInterval}`,
                    dayOfMonth: '*',
                    month: '*',
                    dayOfWeek: '*',
                };
                break;
            case 'daily':
                values = {
                    minute: String(dayMinute),
                    hour: String(dayHour),
                    dayOfMonth: '*',
                    month: '*',
                    dayOfWeek: '*',
                };
                break;
            case 'weekly':
                values = {
                    minute: String(weekMinute),
                    hour: String(weekHour),
                    dayOfMonth: '*',
                    month: '*',
                    dayOfWeek: String(weekDay),
                };
                break;
            case 'monthly':
                values = {
                    minute: String(monthMinute),
                    hour: String(monthHour),
                    dayOfMonth: String(monthDay),
                    month: '*',
                    dayOfWeek: '*',
                };
                break;
        }
        onChangeRef.current(values);
    }, [
        frequency,
        minuteInterval,
        hourInterval,
        hourOffset,
        dayHour,
        dayMinute,
        weekDay,
        weekHour,
        weekMinute,
        monthDay,
        monthHour,
        monthMinute,
    ]);

    return (
        <div css={tw`mt-6`}>
            <div css={tw`flex flex-wrap items-center gap-x-3 gap-y-2`}>
                <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>执行频率</span>
                <Select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                    css={tw`w-auto min-w-0 shrink`}
                >
                    <option value={'minutely'}>按分钟</option>
                    <option value={'hourly'}>按小时</option>
                    <option value={'daily'}>每天</option>
                    <option value={'weekly'}>每周</option>
                    <option value={'monthly'}>每月</option>
                </Select>

                {frequency === 'minutely' && (
                    <>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>每</span>
                        <Select
                            value={minuteInterval}
                            onChange={(e) => setMinuteInterval(Number(e.target.value))}
                            css={tw`w-auto min-w-0 shrink`}
                        >
                            {MINUTE_INTERVALS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </Select>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>分钟执行一次</span>
                    </>
                )}

                {frequency === 'hourly' && (
                    <>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>每</span>
                        <Select
                            value={hourInterval}
                            onChange={(e) => setHourInterval(Number(e.target.value))}
                            css={tw`w-auto min-w-0 shrink`}
                        >
                            {HOUR_INTERVALS.map((h) => (
                                <option key={h} value={h}>
                                    {h}
                                </option>
                            ))}
                        </Select>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>小时，在第</span>
                        <Select
                            value={hourOffset}
                            onChange={(e) => setHourOffset(Number(e.target.value))}
                            css={tw`w-auto min-w-0 shrink`}
                        >
                            {range(0, 59).map((m) => (
                                <option key={m} value={m}>
                                    {String(m).padStart(2, '0')}
                                </option>
                            ))}
                        </Select>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>分执行一次</span>
                    </>
                )}

                {frequency === 'daily' && (
                    <>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>每天</span>
                        <TimePicker
                            hour={dayHour}
                            minute={dayMinute}
                            onHourChange={setDayHour}
                            onMinuteChange={setDayMinute}
                        />
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>执行</span>
                    </>
                )}

                {frequency === 'weekly' && (
                    <>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>每</span>
                        <Select
                            value={weekDay}
                            onChange={(e) => setWeekDay(Number(e.target.value))}
                            css={tw`w-auto min-w-0 shrink`}
                        >
                            {DAYS_OF_WEEK.map((day, i) => (
                                <option key={i} value={i}>
                                    {day}
                                </option>
                            ))}
                        </Select>
                        <TimePicker
                            hour={weekHour}
                            minute={weekMinute}
                            onHourChange={setWeekHour}
                            onMinuteChange={setWeekMinute}
                        />
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>执行</span>
                    </>
                )}

                {frequency === 'monthly' && (
                    <>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>每月</span>
                        <Select
                            value={monthDay}
                            onChange={(e) => setMonthDay(Number(e.target.value))}
                            css={tw`w-auto min-w-0 shrink`}
                        >
                            {range(1, 31).map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </Select>
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>日</span>
                        <TimePicker
                            hour={monthHour}
                            minute={monthMinute}
                            onHourChange={setMonthHour}
                            onMinuteChange={setMonthMinute}
                        />
                        <span css={tw`text-neutral-300 text-sm whitespace-nowrap`}>执行</span>
                    </>
                )}
            </div>
            {frequency === 'monthly' && monthDay > 28 && (
                <p css={tw`text-neutral-400 text-xs mt-2`}>
                    注意：所选日期在部分月份可能不存在（如2月），届时该任务将跳过执行。
                </p>
            )}
        </div>
    );
};
