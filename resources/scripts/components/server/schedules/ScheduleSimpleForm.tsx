import React, { useEffect, useRef, useState } from 'react';
import Select from '@/components/elements/Select';
import Label from '@/components/elements/Label';
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

    const currentHour = frequency === 'daily' ? dayHour : frequency === 'weekly' ? weekHour : monthHour;
    const currentMinute = frequency === 'daily' ? dayMinute : frequency === 'weekly' ? weekMinute : monthMinute;

    return (
        <div css={tw`mt-6`}>
            <div css={tw`grid grid-cols-2 sm:grid-cols-4 gap-4`}>
                <div>
                    <Label>执行频率</Label>
                    <Select value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyType)}>
                        <option value={'minutely'}>按分钟</option>
                        <option value={'hourly'}>按小时</option>
                        <option value={'daily'}>每天</option>
                        <option value={'weekly'}>每周</option>
                        <option value={'monthly'}>每月</option>
                    </Select>
                </div>

                {frequency === 'minutely' && (
                    <div>
                        <Label>间隔（分钟）</Label>
                        <Select value={minuteInterval} onChange={(e) => setMinuteInterval(Number(e.target.value))}>
                            {MINUTE_INTERVALS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}

                {frequency === 'hourly' && (
                    <>
                        <div>
                            <Label>间隔（小时）</Label>
                            <Select value={hourInterval} onChange={(e) => setHourInterval(Number(e.target.value))}>
                                {HOUR_INTERVALS.map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label>偏移（分钟）</Label>
                            <Select value={hourOffset} onChange={(e) => setHourOffset(Number(e.target.value))}>
                                {range(0, 59).map((m) => (
                                    <option key={m} value={m}>
                                        {String(m).padStart(2, '0')}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </>
                )}

                {frequency === 'weekly' && (
                    <div>
                        <Label>星期</Label>
                        <Select value={weekDay} onChange={(e) => setWeekDay(Number(e.target.value))}>
                            {DAYS_OF_WEEK.map((day, i) => (
                                <option key={i} value={i}>
                                    {day}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}

                {frequency === 'monthly' && (
                    <div>
                        <Label>日期</Label>
                        <Select value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))}>
                            {range(1, 31).map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}

                {(frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') && (
                    <>
                        <div>
                            <Label>小时</Label>
                            <Select
                                value={currentHour}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (frequency === 'daily') setDayHour(v);
                                    else if (frequency === 'weekly') setWeekHour(v);
                                    else setMonthHour(v);
                                }}
                            >
                                {range(0, 23).map((h) => (
                                    <option key={h} value={h}>
                                        {String(h).padStart(2, '0')}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label>分钟</Label>
                            <Select
                                value={currentMinute}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (frequency === 'daily') setDayMinute(v);
                                    else if (frequency === 'weekly') setWeekMinute(v);
                                    else setMonthMinute(v);
                                }}
                            >
                                {range(0, 59).map((m) => (
                                    <option key={m} value={m}>
                                        {String(m).padStart(2, '0')}
                                    </option>
                                ))}
                            </Select>
                        </div>
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
