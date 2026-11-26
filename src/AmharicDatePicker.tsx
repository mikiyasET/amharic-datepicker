import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { 
    ethMonths, 
    ethDays, 
    getDaysInMonth, 
    getFirstDayOfMonth, 
    toEthiopian, 
    type EthAMPM,
    ethAMPMs,
    toEthiopianTime,
    getEthTimePeriod,
    toGregorianTime,
    gregMonths,
    gregDays,
    gregAMPMs,
    type GregAMPM,
    getGregFirstDayOfMonth,
    getGregDaysInMonth,
    toGregorianTime12h,
    toGregorian,
    toGregorianTime24h,
    compareEthDates,
    isValidEthDate,
    parseEthiopianDate,
    toGeez
} from 'amharic-datepicker-utils';
import './AmharicDatePicker.css';

export { compareEthDates };

export interface EthDateValue {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    ampm?: EthAMPM | GregAMPM | string;
}

export type DatePickerValue = EthDateValue | Date | string | null | undefined;

export interface CustomColors {
    text?: string;
    selectedText?: string;
    hoverBg?: string;
    hoverText?: string;
    selectedHoverText?: string;
    disabledText?: string;
    monthHeader?: string;
    saveBtnBg?: string;
    saveBtnText?: string;
    cancelBtnBg?: string;
    cancelBtnText?: string;
    todayBtnBg?: string;
    todayBtnText?: string;
    inRangeBg?: string;
    inputBg?: string;
    inputBorder?: string;
    inputFocusBorder?: string;
    todayIndicator?: string;
}

export interface AmharicDatePickerProps {
    value?: DatePickerValue;
    startDate?: DatePickerValue;
    endDate?: DatePickerValue;
    onChange?: (value: any) => void;
    showTime?: boolean;
    showActions?: boolean;
    calendarType?: 'ethiopian' | 'gregorian';
    outputFormat?: 'ethiopian' | 'gregorian';
    theme?: 'light' | 'dark';
    primaryColor?: string;
    customColors?: CustomColors;
    selectsRange?: boolean;
    size?: 'small' | 'medium' | 'large';
    placeholder?: string;
    
    // Modern features & options
    allowManualInput?: boolean;     // Enable manual typing into input (default: true)
    clearable?: boolean;            // Show clear 'X' button (default: false)
    showTodayButton?: boolean;      // Show quick "Today / ዛሬ" jump button (default: true)
    showCalendarIcon?: boolean;     // Show calendar icon inside the input (default: true)
    minDate?: DatePickerValue;      // Minimum selectable date
    maxDate?: DatePickerValue;      // Maximum selectable date
    useGeez?: boolean;              // Display Ethiopian day numerals in Ge'ez (፩, ፪, ፫...) (default: false)
    disabled?: boolean;             // Disables user interaction completely
    readOnly?: boolean;             // Prevents typing, popup can still open
    className?: string;             // Custom wrapper CSS class
    inputClassName?: string;        // Custom input CSS class
    popupClassName?: string;        // Custom popup dropdown CSS class
    name?: string;                  // HTML form field name
    id?: string;                    // HTML element id
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

type ViewState = 'date' | 'month' | 'year';

export const AmharicDatePicker: React.FC<AmharicDatePickerProps> = (props) => {
    const { 
        value, 
        startDate, 
        endDate, 
        onChange, 
        showTime = false, 
        showActions = true, 
        calendarType = 'ethiopian', 
        outputFormat,
        theme = 'light',
        primaryColor,
        customColors,
        selectsRange = false,
        size = 'medium',
        placeholder = "ቀን ይምረጡ / Select Date",
        allowManualInput = true,
        clearable = false,
        showTodayButton = true,
        showCalendarIcon = true,
        minDate,
        maxDate,
        useGeez = false,
        disabled = false,
        readOnly = false,
        className = '',
        inputClassName = '',
        popupClassName = '',
        name,
        id,
        onBlur,
        onFocus
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isUserTypingRef = useRef<boolean>(false);

    const [isOpen, setIsOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState<'bottom' | 'top'>('bottom');
    const isGreg = calendarType === 'gregorian';

    // Conversion helpers between calendars
    const toGregorianValue = (d: EthDateValue): EthDateValue => {
        const greg = toGregorian(d.year, d.month, d.day);
        if (showTime && d.hour) {
            const gTime = toGregorianTime(d.hour, d.minute || 0, (d.ampm as EthAMPM) || 'ቀን');
            const gTime12 = toGregorianTime12h(gTime.hour);
            return { 
                year: greg.year, 
                month: greg.month, 
                day: greg.day, 
                hour: gTime12.hour, 
                minute: gTime.minute, 
                ampm: gTime12.ampm 
            };
        }
        return { year: greg.year, month: greg.month, day: greg.day };
    };

    const toEthiopianValue = (d: EthDateValue): EthDateValue => {
        const eth = toEthiopian(d.year, d.month, d.day);
        if (showTime && d.hour) {
            const gTime24 = toGregorianTime24h(d.hour, (d.ampm as GregAMPM) || 'AM');
            const ethTime = toEthiopianTime(gTime24, d.minute || 0);
            return { 
                year: eth.year, 
                month: eth.month, 
                day: eth.day, 
                hour: ethTime.hour, 
                minute: ethTime.minute, 
                ampm: ethTime.ampm 
            };
        }
        return { year: eth.year, month: eth.month, day: eth.day };
    };

    // Helper: Normalize any DatePickerValue (Date | string | EthDateValue | null)
    const normalizeDate = (val: DatePickerValue): EthDateValue | null => {
        if (!val) return null;

        if (val instanceof Date) {
            if (isNaN(val.getTime())) return null;
            if (isGreg) {
                const timeObj = toGregorianTime12h(val.getHours());
                return {
                    year: val.getFullYear(),
                    month: val.getMonth() + 1,
                    day: val.getDate(),
                    ...(showTime ? { hour: timeObj.hour, minute: val.getMinutes(), ampm: timeObj.ampm } : {})
                };
            } else {
                const eth = toEthiopian(val.getFullYear(), val.getMonth() + 1, val.getDate());
                if (showTime) {
                    const ethTime = toEthiopianTime(val.getHours(), val.getMinutes());
                    return { ...eth, ...ethTime };
                }
                return eth;
            }
        }

        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (!trimmed) return null;

            if (!isGreg) {
                const parsedEth = parseEthiopianDate(trimmed);
                if (parsedEth && isValidEthDate(parsedEth.year, parsedEth.month, parsedEth.day)) {
                    return parsedEth;
                }
                // Try numeric regex: DD/MM/YYYY or YYYY-MM-DD
                const m = trimmed.match(/^(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})$/);
                if (m) {
                    let y: number, mo: number, d: number;
                    if (m[1].length === 4) {
                        y = parseInt(m[1], 10);
                        mo = parseInt(m[2], 10);
                        d = parseInt(m[3], 10);
                    } else {
                        d = parseInt(m[1], 10);
                        mo = parseInt(m[2], 10);
                        y = parseInt(m[3], 10);
                    }
                    if (isValidEthDate(y, mo, d)) {
                        return { year: y, month: mo, day: d };
                    }
                }
                // Fallback: Check if valid ISO string
                const gDate = new Date(trimmed);
                if (!isNaN(gDate.getTime())) {
                    const eth = toEthiopian(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
                    return eth;
                }
            } else {
                const gDate = new Date(trimmed);
                if (!isNaN(gDate.getTime())) {
                    const timeObj = toGregorianTime12h(gDate.getHours());
                    return {
                        year: gDate.getFullYear(),
                        month: gDate.getMonth() + 1,
                        day: gDate.getDate(),
                        ...(showTime ? { hour: timeObj.hour, minute: gDate.getMinutes(), ampm: timeObj.ampm } : {})
                    };
                }
            }
            return null;
        }

        if (typeof val === 'object' && 'year' in val && 'month' in val && 'day' in val) {
            const raw = { ...val };
            if (outputFormat === 'gregorian' && !isGreg) {
                return toEthiopianValue(raw);
            }
            if (outputFormat === 'ethiopian' && isGreg) {
                return toGregorianValue(raw);
            }
            if (isGreg && (raw.month === 13 || raw.ampm === 'ቀን' || raw.ampm === 'ማታ' || raw.ampm === 'ንጋት' || raw.ampm === 'ጠዋት' || raw.ampm === 'ከሰዓት' || raw.ampm === 'ወደ ማታ' || raw.ampm === 'ምሽት' || raw.ampm === 'ሌሊት' || raw.ampm === 'እኩለ ሌሊት')) {
                return toGregorianValue(raw);
            }
            if (!isGreg && (raw.ampm === 'AM' || raw.ampm === 'PM')) {
                return toEthiopianValue(raw);
            }
            return raw;
        }

        return null;
    };

    const formatOutput = (d: EthDateValue | null): EthDateValue | null => {
        if (!d) return null;
        if (outputFormat === 'gregorian') {
            return isGreg ? d : toGregorianValue(d);
        }
        if (outputFormat === 'ethiopian') {
            return isGreg ? toEthiopianValue(d) : d;
        }
        return d;
    };

    // Calculate real-world Today's date in current calendar
    const getTodayValue = (): EthDateValue => {
        const now = new Date();
        if (isGreg) {
            const timeObj = toGregorianTime12h(now.getHours());
            return {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                ...(showTime ? { hour: timeObj.hour, minute: now.getMinutes(), ampm: timeObj.ampm } : {})
            };
        } else {
            const ethDate = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
            if (showTime) {
                const ethTime = toEthiopianTime(now.getHours(), now.getMinutes());
                return { ...ethDate, ...ethTime };
            }
            return ethDate;
        }
    };

    const todayValue = getTodayValue();

    // Min & Max date normalization
    const minDateVal = normalizeDate(minDate);
    const maxDateVal = normalizeDate(maxDate);

    const isDateDisabled = (d: EthDateValue): boolean => {
        if (minDateVal && compareEthDates(d, minDateVal) < 0) return true;
        if (maxDateVal && compareEthDates(d, maxDateVal) > 0) return true;
        return false;
    };

    // State initialization
    const initialDate = normalizeDate(value) || todayValue;
    const [currentDate, setCurrentDate] = useState<EthDateValue | null>(value !== undefined ? normalizeDate(value) : initialDate);
    const [tempDate, setTempDate] = useState<EthDateValue | null>(currentDate || initialDate);
    
    const [currentStartDate, setCurrentStartDate] = useState<EthDateValue | null>(normalizeDate(startDate));
    const [currentEndDate, setCurrentEndDate] = useState<EthDateValue | null>(normalizeDate(endDate));
    const [tempStartDate, setTempStartDate] = useState<EthDateValue | null>(currentStartDate);
    const [tempEndDate, setTempEndDate] = useState<EthDateValue | null>(currentEndDate);
    const [hoverDate, setHoverDate] = useState<EthDateValue | null>(null);

    const [viewDate, setViewDate] = useState<EthDateValue>(currentStartDate || currentDate || initialDate);
    const [viewState, setViewState] = useState<ViewState>('date');
    const [yearRangeStart, setYearRangeStart] = useState<number>(Math.floor((currentDate || initialDate).year / 12) * 12);

    // Single Date Formatter
    const formatSingleDateDisplay = (d: EthDateValue | null | undefined): string => {
        if (!d || !d.year || !d.month || !d.day) return '';
        const activeMonths = isGreg ? gregMonths : ethMonths;
        const monthName = activeMonths[d.month - 1] || `${d.month}`;
        
        let timeStr = '';
        if (showTime && d.hour) {
            const mm = (d.minute || 0).toString().padStart(2, '0');
            if (isGreg) {
                timeStr = ` - ${d.hour}:${mm} ${d.ampm || 'AM'}`;
            } else {
                const greg = toGregorianTime(d.hour, d.minute || 0, (d.ampm as EthAMPM) || 'ቀን');
                const period = getEthTimePeriod(greg.hour);
                timeStr = ` - ${period} ${d.hour}:${mm}`;
            }
        }
        return `${monthName} ${d.day}, ${d.year}${timeStr}`;
    };

    // Range Formatter
    const formatRangeDisplay = (start: EthDateValue | null, end: EthDateValue | null): string => {
        const s = formatSingleDateDisplay(start);
        const e = formatSingleDateDisplay(end);
        if (s && e) return `${s}  →  ${e}`;
        if (s) return `${s}  →  ...`;
        return '';
    };

    const getFormattedDisplay = (): string => {
        if (selectsRange) {
            return formatRangeDisplay(currentStartDate, currentEndDate);
        }
        return currentDate ? formatSingleDateDisplay(currentDate) : '';
    };

    // Input text state for manual typing
    const [inputDisplayValue, setInputDisplayValue] = useState<string>(getFormattedDisplay());

    // Sync input text when selected date changes externally
    useEffect(() => {
        if (!isUserTypingRef.current) {
            setInputDisplayValue(getFormattedDisplay());
        }
    }, [currentDate, currentStartDate, currentEndDate, selectsRange, isGreg, showTime]);

    // External prop synchronization
    useEffect(() => {
        if (value !== undefined) {
            const norm = normalizeDate(value);
            setCurrentDate(norm);
            if (norm) {
                setTempDate(norm);
                setViewDate(norm);
            }
        }
    }, [value, isGreg]);

    useEffect(() => {
        if (startDate !== undefined) {
            const norm = normalizeDate(startDate);
            setCurrentStartDate(norm);
            setTempStartDate(norm);
            if (norm) setViewDate(norm);
        }
    }, [startDate, isGreg]);

    useEffect(() => {
        if (endDate !== undefined) {
            const norm = normalizeDate(endDate);
            setCurrentEndDate(norm);
            setTempEndDate(norm);
        }
    }, [endDate, isGreg]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleSave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, tempDate, tempStartDate, tempEndDate]);

    const handleSave = () => {
        if (selectsRange) {
            setCurrentStartDate(tempStartDate);
            setCurrentEndDate(tempEndDate);
            if (onChange) onChange([formatOutput(tempStartDate), formatOutput(tempEndDate)]);
        } else {
            setCurrentDate(tempDate);
            if (onChange) onChange(formatOutput(tempDate));
        }
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (selectsRange) {
            setTempStartDate(currentStartDate);
            setTempEndDate(currentEndDate);
            if (currentStartDate) setViewDate(currentStartDate);
        } else {
            setTempDate(currentDate);
            if (currentDate) setViewDate(currentDate);
        }
        setInputDisplayValue(getFormattedDisplay());
        setIsOpen(false);
    };

    const handleClear = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (disabled) return;

        if (selectsRange) {
            setCurrentStartDate(null);
            setCurrentEndDate(null);
            setTempStartDate(null);
            setTempEndDate(null);
            onChange?.([null, null]);
        } else {
            setCurrentDate(null);
            setTempDate(null);
            onChange?.(null);
        }
        setInputDisplayValue('');
        setIsOpen(false);
    };

    const handleJumpToToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        const today = getTodayValue();
        if (isDateDisabled(today)) return;

        setViewDate(today);
        setYearRangeStart(Math.floor(today.year / 12) * 12);
        setViewState('date');

        if (selectsRange) {
            setTempStartDate(today);
            setTempEndDate(null);
            if (!showActions && !showTime) {
                setCurrentStartDate(today);
                setCurrentEndDate(null);
                onChange?.([formatOutput(today), null]);
            }
        } else {
            setTempDate(today);
            if (!showActions && !showTime) {
                setCurrentDate(today);
                onChange?.(formatOutput(today));
                setIsOpen(false);
            }
        }
    };

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewState === 'date') {
            setViewDate(prev => {
                let newMonth = prev.month - 1;
                let newYear = prev.year;
                if (newMonth < 1) {
                    newMonth = isGreg ? 12 : 13;
                    newYear -= 1;
                }
                return { ...prev, month: newMonth, year: newYear };
            });
        } else if (viewState === 'month') {
            setViewDate(prev => ({ ...prev, year: prev.year - 1 }));
        } else if (viewState === 'year') {
            setYearRangeStart(prev => prev - 12);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewState === 'date') {
            setViewDate(prev => {
                let newMonth = prev.month + 1;
                let newYear = prev.year;
                if (newMonth > (isGreg ? 12 : 13)) {
                    newMonth = 1;
                    newYear += 1;
                }
                return { ...prev, month: newMonth, year: newYear };
            });
        } else if (viewState === 'month') {
            setViewDate(prev => ({ ...prev, year: prev.year + 1 }));
        } else if (viewState === 'year') {
            setYearRangeStart(prev => prev + 12);
        }
    };

    const handleDateSelect = (day: number) => {
        const baseDate = selectsRange ? (tempStartDate || tempDate || initialDate) : (tempDate || initialDate);
        const newDate: EthDateValue = { ...baseDate, year: viewDate.year, month: viewDate.month, day };

        if (isDateDisabled(newDate)) return;
        
        if (selectsRange) {
            if (!tempStartDate || (tempStartDate && tempEndDate)) {
                setTempStartDate(newDate);
                setTempEndDate(null);
                if (!showActions && !showTime) {
                    onChange?.([formatOutput(newDate), null]);
                }
            } else {
                if (compareEthDates(newDate, tempStartDate) < 0) {
                    setTempStartDate(newDate);
                    setTempEndDate(null);
                    if (!showActions && !showTime) onChange?.([formatOutput(newDate), null]);
                } else {
                    setTempEndDate(newDate);
                    if (!showActions && !showTime) {
                        setCurrentStartDate(tempStartDate);
                        setCurrentEndDate(newDate);
                        onChange?.([formatOutput(tempStartDate), formatOutput(newDate)]);
                        setIsOpen(false);
                    }
                }
            }
        } else {
            setTempDate(newDate);
            if (!showActions && !showTime) {
                setCurrentDate(newDate);
                onChange?.(formatOutput(newDate));
                setIsOpen(false);
            }
        }
    };

    const handleTimeChange = (field: 'hour' | 'minute' | 'ampm', val: string | number, target: 'start' | 'end' | 'single' = 'single') => {
        if (target === 'start') {
            setTempStartDate(prev => prev ? { ...prev, [field]: val } : null);
        } else if (target === 'end') {
            setTempEndDate(prev => prev ? { ...prev, [field]: val } : null);
        } else {
            setTempDate(prev => ({ ...(prev || initialDate), [field]: val }));
        }
    };

    // Manual input typing commit handler
    const commitManualInput = (raw: string) => {
        isUserTypingRef.current = false;
        const trimmed = raw.trim();

        if (!trimmed) {
            if (clearable) {
                handleClear();
            } else {
                setInputDisplayValue(getFormattedDisplay());
            }
            return;
        }

        if (selectsRange) {
            const parts = trimmed.split(/[-–—→]/).map(p => p.trim());
            if (parts.length === 2) {
                const p1 = normalizeDate(parts[0]);
                const p2 = normalizeDate(parts[1]);
                if (p1 && p2 && !isDateDisabled(p1) && !isDateDisabled(p2)) {
                    const [start, end] = compareEthDates(p1, p2) <= 0 ? [p1, p2] : [p2, p1];
                    setCurrentStartDate(start);
                    setCurrentEndDate(end);
                    setTempStartDate(start);
                    setTempEndDate(end);
                    setViewDate(start);
                    onChange?.([formatOutput(start), formatOutput(end)]);
                    setInputDisplayValue(formatRangeDisplay(start, end));
                    return;
                }
            }
            setInputDisplayValue(getFormattedDisplay());
            return;
        }

        const parsed = normalizeDate(trimmed);
        if (parsed && !isDateDisabled(parsed)) {
            if (showTime && currentDate?.hour && !parsed.hour) {
                parsed.hour = currentDate.hour;
                parsed.minute = currentDate.minute;
                parsed.ampm = currentDate.ampm;
            }
            setCurrentDate(parsed);
            setTempDate(parsed);
            setViewDate(parsed);
            onChange?.(formatOutput(parsed));
            setInputDisplayValue(formatSingleDateDisplay(parsed));
        } else {
            setInputDisplayValue(getFormattedDisplay());
        }
    };

    const renderCalendarDays = () => {
        const firstDay = isGreg ? getGregFirstDayOfMonth(viewDate.year, viewDate.month) : getFirstDayOfMonth(viewDate.year, viewDate.month);
        const daysInMonth = isGreg ? getGregDaysInMonth(viewDate.year, viewDate.month) : getDaysInMonth(viewDate.year, viewDate.month);
        const days = [];

        // Previous month filler days
        let prevMonth = viewDate.month - 1;
        let prevYear = viewDate.year;
        if (prevMonth < 1) {
            prevMonth = isGreg ? 12 : 13;
            prevYear -= 1;
        }
        const prevMonthDays = isGreg ? getGregDaysInMonth(prevYear, prevMonth) : getDaysInMonth(prevYear, prevMonth);
        
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(<div key={`prev-${i}`} className="eth-dp-day empty">{prevMonthDays - i}</div>);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const currentD: EthDateValue = { year: viewDate.year, month: viewDate.month, day };
            let isSelected = false;
            let isInRange = false;
            let isRangeStart = false;
            let isRangeEnd = false;
            let isHoverRange = false;

            if (selectsRange) {
                isRangeStart = !!(tempStartDate && compareEthDates(tempStartDate, currentD) === 0);
                isRangeEnd = !!(tempEndDate && compareEthDates(tempEndDate, currentD) === 0);
                isSelected = isRangeStart || isRangeEnd;
                isInRange = !!(tempStartDate && tempEndDate && compareEthDates(currentD, tempStartDate) > 0 && compareEthDates(currentD, tempEndDate) < 0);
                isHoverRange = !!(tempStartDate && !tempEndDate && hoverDate && compareEthDates(currentD, tempStartDate) > 0 && compareEthDates(currentD, hoverDate) <= 0);
            } else {
                isSelected = !!(tempDate && tempDate.year === viewDate.year && tempDate.month === viewDate.month && tempDate.day === day);
            }

            const isToday = todayValue.year === viewDate.year && todayValue.month === viewDate.month && todayValue.day === day;
            const isDisabled = isDateDisabled(currentD);

            let classes = 'eth-dp-day';
            if (isSelected) classes += ' selected';
            if (isInRange || isHoverRange) classes += ' in-range';
            if (isRangeStart) classes += ' range-start';
            if (isRangeEnd) classes += ' range-end';
            if (isToday) classes += ' is-today';
            if (isDisabled) classes += ' is-disabled';

            const displayDayNumber = (!isGreg && useGeez) ? toGeez(day) : day;

            days.push(
                <button
                    key={day}
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    onMouseEnter={() => selectsRange && !tempEndDate && setHoverDate(currentD)}
                    className={classes}
                    type="button"
                    disabled={isDisabled}
                    title={isToday ? "ዛሬ / Today" : undefined}
                >
                    {displayDayNumber}
                </button>
            );
        }

        let nextMonthDay = 1;
        while (days.length < 42) {
            days.push(<div key={`next-${nextMonthDay}`} className="eth-dp-day empty">{nextMonthDay}</div>);
            nextMonthDay++;
        }

        return days;
    };

    const renderMonths = () => {
        const monthsList = isGreg ? gregMonths : ethMonths;
        return (
            <div className="eth-dp-grid-3">
                {monthsList.map((monthName, i) => {
                    const monthNumber = i + 1;
                    const isSelected = viewDate.month === monthNumber;
                    return (
                        <button 
                            key={monthName}
                            type="button"
                            className={`eth-dp-grid-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                                setViewDate(prev => ({ ...prev, month: monthNumber }));
                                setViewState('date');
                            }}
                        >
                            {monthName}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderYears = () => {
        const years = [];
        for (let i = 0; i < 12; i++) {
            const y = yearRangeStart + i;
            const isSelected = viewDate.year === y;
            years.push(
                <button 
                    key={y}
                    type="button"
                    className={`eth-dp-grid-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                        setViewDate(prev => ({ ...prev, year: y }));
                        setViewState('month');
                    }}
                >
                    {y}
                </button>
            );
        }
        return (
            <div className="eth-dp-grid-3">
                {years}
            </div>
        );
    };

    const activeMonths = isGreg ? gregMonths : ethMonths;
    const activeDays = isGreg ? gregDays : ethDays;
    const activeAMPMs = isGreg ? gregAMPMs : ethAMPMs;

    const hasValue = selectsRange 
        ? Boolean(currentStartDate || currentEndDate)
        : Boolean(currentDate);

    const customStyles = {
        ...(primaryColor ? { '--eth-dp-primary': primaryColor } : {}),
        ...(customColors?.text ? { '--eth-dp-text': customColors.text } : {}),
        ...(customColors?.selectedText ? { '--eth-dp-selected-text': customColors.selectedText } : {}),
        ...(customColors?.hoverBg ? { '--eth-dp-hover-bg': customColors.hoverBg } : {}),
        ...(customColors?.hoverText ? { '--eth-dp-hover-text': customColors.hoverText } : {}),
        ...(customColors?.selectedHoverText ? { '--eth-dp-selected-hover-text': customColors.selectedHoverText } : {}),
        ...(customColors?.disabledText ? { '--eth-dp-disabled-text': customColors.disabledText } : {}),
        ...(customColors?.monthHeader ? { '--eth-dp-month-header': customColors.monthHeader } : {}),
        ...(customColors?.saveBtnBg ? { '--eth-dp-save-bg': customColors.saveBtnBg } : {}),
        ...(customColors?.saveBtnText ? { '--eth-dp-save-text': customColors.saveBtnText } : {}),
        ...(customColors?.cancelBtnBg ? { '--eth-dp-cancel-bg': customColors.cancelBtnBg } : {}),
        ...(customColors?.cancelBtnText ? { '--eth-dp-cancel-text': customColors.cancelBtnText } : {}),
        ...(customColors?.todayBtnBg ? { '--eth-dp-today-bg': customColors.todayBtnBg } : {}),
        ...(customColors?.todayBtnText ? { '--eth-dp-today-text': customColors.todayBtnText } : {}),
        ...(customColors?.inRangeBg ? { '--eth-dp-in-range-bg': customColors.inRangeBg } : {}),
        ...(customColors?.inputBg ? { '--eth-dp-input-bg': customColors.inputBg } : {}),
        ...(customColors?.inputBorder ? { '--eth-dp-input-border': customColors.inputBorder } : {}),
        ...(customColors?.inputFocusBorder ? { '--eth-dp-input-focus-border': customColors.inputFocusBorder } : {}),
        ...(customColors?.todayIndicator ? { '--eth-dp-today-indicator': customColors.todayIndicator } : {}),
    } as React.CSSProperties;

    const togglePopup = () => {
        if (disabled) return;
        if (!isOpen) {
            if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                if (spaceBelow < 380 && spaceAbove > spaceBelow) {
                    setPopupPosition('top');
                } else {
                    setPopupPosition('bottom');
                }
            }

            if (selectsRange) {
                setTempStartDate(currentStartDate);
                setTempEndDate(currentEndDate);
                const target = currentStartDate || currentDate || initialDate;
                setViewDate(target);
                setYearRangeStart(Math.floor(target.year / 12) * 12);
            } else {
                setTempDate(currentDate);
                const target = currentDate || initialDate;
                setViewDate(target);
                setYearRangeStart(Math.floor(target.year / 12) * 12);
            }
            setViewState('date');
        }
        setIsOpen(!isOpen);
    };

    return (
        <div 
            className={`eth-dp-container eth-dp-theme-${theme} eth-dp-size-${size} ${disabled ? 'is-disabled' : ''} ${className}`} 
            ref={containerRef}
            style={Object.keys(customStyles).length > 0 ? customStyles : undefined}
        >
            <div className="eth-dp-input-wrapper">
                <input 
                    ref={inputRef}
                    type="text"
                    name={name}
                    id={id}
                    readOnly={!allowManualInput || readOnly || disabled}
                    disabled={disabled}
                    className={`eth-dp-input ${inputClassName}`}
                    placeholder={placeholder}
                    value={inputDisplayValue}
                    onChange={(e) => {
                        if (allowManualInput && !readOnly && !disabled) {
                            isUserTypingRef.current = true;
                            setInputDisplayValue(e.target.value);
                        }
                    }}
                    onFocus={(e) => {
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        if (allowManualInput && !readOnly && !disabled) {
                            commitManualInput(inputDisplayValue);
                        }
                        onBlur?.(e);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (allowManualInput && !readOnly && !disabled) {
                                commitManualInput(inputDisplayValue);
                            }
                            setIsOpen(false);
                        } else if (e.key === 'Escape') {
                            handleCancel();
                        }
                    }}
                    onClick={() => {
                        if (!isOpen) {
                            togglePopup();
                        }
                    }}
                />

                <div className="eth-dp-input-actions">
                    {clearable && hasValue && !disabled && (
                        <button 
                            type="button" 
                            className="eth-dp-clear-btn" 
                            onClick={handleClear} 
                            title="ቀን አጽዳ / Clear date"
                        >
                            <X size={15} />
                        </button>
                    )}

                    {showCalendarIcon && (
                        <button 
                            type="button" 
                            className="eth-dp-calendar-btn" 
                            onClick={togglePopup}
                            disabled={disabled}
                            title="ቀን ይምረጡ / Pick date"
                        >
                            <CalendarIcon size={16} />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && !disabled && (
                <div 
                    className={`eth-dp-popup ${popupClassName}`}
                    style={{
                        ...(popupPosition === 'top' ? { top: 'auto', bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)', bottom: 'auto' })
                    }}
                >
                    <div className="eth-dp-header">
                        <div className="eth-dp-header-left">
                            {viewState === 'date' && (
                                <>
                                    <button 
                                        type="button" 
                                        className="eth-dp-header-pill" 
                                        onClick={() => setViewState('month')}
                                    >
                                        {activeMonths[viewDate.month - 1]}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="eth-dp-header-pill" 
                                        onClick={() => {
                                            setYearRangeStart(Math.floor(viewDate.year / 12) * 12);
                                            setViewState('year');
                                        }}
                                    >
                                        {viewDate.year}
                                    </button>
                                </>
                            )}
                            {viewState === 'month' && (
                                <button 
                                    type="button" 
                                    className="eth-dp-header-pill" 
                                    onClick={() => {
                                        setYearRangeStart(Math.floor(viewDate.year / 12) * 12);
                                        setViewState('year');
                                    }}
                                >
                                    {viewDate.year}
                                </button>
                            )}
                            {viewState === 'year' && (
                                <span className="eth-dp-header-range">
                                    {yearRangeStart} - {yearRangeStart + 11}
                                </span>
                            )}
                        </div>

                        <div className="eth-dp-header-right">
                            <button type="button" onClick={handlePrevious} className="eth-dp-icon-btn" title="ቀዳሚ / Previous">
                                <ChevronLeft size={18} strokeWidth={2.2} />
                            </button>
                            <button type="button" onClick={handleNext} className="eth-dp-icon-btn" title="ቀጣይ / Next">
                                <ChevronRight size={18} strokeWidth={2.2} />
                            </button>
                        </div>
                    </div>

                    <div className="eth-dp-body">
                        {viewState === 'date' && (
                            <>
                                <div className="eth-dp-weekdays">
                                    {activeDays.map(day => (
                                        <div key={day} className="eth-dp-weekday">{day.substring(0, 3)}</div>
                                    ))}
                                </div>
                                <div className="eth-dp-days-grid">
                                    {renderCalendarDays()}
                                </div>
                            </>
                        )}

                        {viewState === 'month' && renderMonths()}
                        {viewState === 'year' && renderYears()}
                    </div>
                    
                    {showTime && viewState === 'date' && (
                        <div className="eth-dp-time-section">
                            {!selectsRange ? (
                                <div className="eth-dp-time-inputs">
                                    <select 
                                        className="eth-dp-select"
                                        value={tempDate?.hour || 12} 
                                        onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                    >
                                        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                            <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                    <span className="eth-dp-time-colon">:</span>
                                    <select 
                                        className="eth-dp-select"
                                        value={tempDate?.minute || 0} 
                                        onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                    >
                                        {Array.from({length: 60}, (_, i) => i).map(m => (
                                            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                    <select 
                                        className="eth-dp-select"
                                        value={tempDate?.ampm || activeAMPMs[0]} 
                                        onChange={(e) => handleTimeChange('ampm', e.target.value)}
                                    >
                                        {activeAMPMs.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="eth-dp-range-time-wrapper">
                                    <div className="eth-dp-range-time-row">
                                        <span className="eth-dp-range-time-label">መጀመሪያ / Start</span>
                                        <div className="eth-dp-time-inputs range-inputs">
                                            <select 
                                                className="eth-dp-select"
                                                value={tempStartDate?.hour || 12} 
                                                onChange={(e) => handleTimeChange('hour', parseInt(e.target.value), 'start')}
                                                disabled={!tempStartDate}
                                            >
                                                {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <span className="eth-dp-time-colon">:</span>
                                            <select 
                                                className="eth-dp-select"
                                                value={tempStartDate?.minute || 0} 
                                                onChange={(e) => handleTimeChange('minute', parseInt(e.target.value), 'start')}
                                                disabled={!tempStartDate}
                                            >
                                                {Array.from({length: 60}, (_, i) => i).map(m => (
                                                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <select 
                                                className="eth-dp-select"
                                                value={tempStartDate?.ampm || activeAMPMs[0]} 
                                                onChange={(e) => handleTimeChange('ampm', e.target.value, 'start')}
                                                disabled={!tempStartDate}
                                            >
                                                {activeAMPMs.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="eth-dp-range-time-row">
                                        <span className="eth-dp-range-time-label">መጨረሻ / End</span>
                                        <div className="eth-dp-time-inputs range-inputs">
                                            <select 
                                                className="eth-dp-select"
                                                value={tempEndDate?.hour || 12} 
                                                onChange={(e) => handleTimeChange('hour', parseInt(e.target.value), 'end')}
                                                disabled={!tempEndDate}
                                            >
                                                {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <span className="eth-dp-time-colon">:</span>
                                            <select 
                                                className="eth-dp-select"
                                                value={tempEndDate?.minute || 0} 
                                                onChange={(e) => handleTimeChange('minute', parseInt(e.target.value), 'end')}
                                                disabled={!tempEndDate}
                                            >
                                                {Array.from({length: 60}, (_, i) => i).map(m => (
                                                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <select 
                                                className="eth-dp-select"
                                                value={tempEndDate?.ampm || activeAMPMs[0]} 
                                                onChange={(e) => handleTimeChange('ampm', e.target.value, 'end')}
                                                disabled={!tempEndDate}
                                            >
                                                {activeAMPMs.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="eth-dp-actions">
                        <div className="eth-dp-actions-left">
                            {showTodayButton && (
                                <button 
                                    type="button" 
                                    className="eth-dp-today-btn" 
                                    onClick={handleJumpToToday}
                                >
                                    {!isGreg ? "ዛሬ" : "Today"}
                                </button>
                            )}
                        </div>

                        {showActions && (
                            <div className="eth-dp-actions-right">
                                <button type="button" className="eth-dp-cancel-btn" onClick={handleCancel}>
                                    {!isGreg ? "ሰርዝ" : "Cancel"}
                                </button>
                                <button type="button" className="eth-dp-save-btn" onClick={handleSave}>
                                    {!isGreg ? "አስቀምጥ" : "Apply"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
