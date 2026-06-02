import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
    ethMonths, 
    ethDays, 
    getDaysInMonth, 
    getFirstDayOfMonth, 
    toEthiopian, 
    EthAMPM,
    ethAMPMs,
    toEthiopianTime,
    getEthTimePeriod,
    toGregorianTime,
    gregMonths,
    gregDays,
    gregAMPMs,
    GregAMPM,
    getGregFirstDayOfMonth,
    getGregDaysInMonth,
    toGregorianTime12h,
    toGregorian,
    toGregorianTime24h
} from 'amharic-datepicker-utils';
import './AmharicDatePicker.css';

export interface EthDateValue {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    ampm?: EthAMPM | GregAMPM | string;
}

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
    inRangeBg?: string;
}

export const compareEthDates = (a?: EthDateValue | null, b?: EthDateValue | null) => {
    if (!a || !b) return 0;
    const valA = a.year * 10000 + a.month * 100 + a.day;
    const valB = b.year * 10000 + b.month * 100 + b.day;
    return valA - valB;
};

export interface AmharicDatePickerProps {
    value?: EthDateValue;
    startDate?: EthDateValue | null;
    endDate?: EthDateValue | null;
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
        size = 'small',
        placeholder = "ቀን ይምረጡ / Select Date"
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState<'bottom' | 'top'>('bottom');
    
    const isGreg = calendarType === 'gregorian';

    const isProbablyEthiopian = (d: EthDateValue) => d.year < 2020 || d.ampm === 'ቀን' || d.ampm === 'ማታ' || d.ampm === 'ጠዋት' || d.ampm === 'ከሰዓት' || d.ampm === 'ምሽት' || d.ampm === 'ሌሊት';
    const isProbablyGregorian = (d: EthDateValue) => d.year >= 2020 || d.ampm === 'AM' || d.ampm === 'PM';

    const convertDate = (d: EthDateValue, toGreg: boolean): EthDateValue => {
        if (toGreg && isProbablyEthiopian(d)) {
            const greg = toGregorian(d.year, d.month, d.day);
            const gTime = toGregorianTime(d.hour || 1, d.minute || 0, (d.ampm as EthAMPM) || 'ቀን');
            const gTime12 = toGregorianTime12h(gTime.hour);
            return { ...d, year: greg.year, month: greg.month, day: greg.day, hour: gTime12.hour, minute: gTime.minute, ampm: gTime12.ampm };
        } else if (!toGreg && isProbablyGregorian(d)) {
            const eth = toEthiopian(d.year, d.month, d.day);
            const gTime24 = toGregorianTime24h(d.hour || 12, (d.ampm as GregAMPM) || 'AM');
            const ethTime = toEthiopianTime(gTime24, d.minute || 0);
            return { ...d, year: eth.year, month: eth.month, day: eth.day, hour: ethTime.hour, minute: ethTime.minute, ampm: ethTime.ampm };
        }
        return d;
    };

    const formatOutput = (d: EthDateValue | null): EthDateValue | null => {
        if (!d) return null;
        if (outputFormat === 'gregorian') return convertDate(d, true);
        if (outputFormat === 'ethiopian') return convertDate(d, false);
        return d;
    };

    // The officially committed date
    const [currentDate, setCurrentDate] = useState<EthDateValue>(() => {
        if (value) return value;
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
    });

    const [tempDate, setTempDate] = useState<EthDateValue>(currentDate);
    
    const [currentStartDate, setCurrentStartDate] = useState<EthDateValue | null>(startDate || null);
    const [currentEndDate, setCurrentEndDate] = useState<EthDateValue | null>(endDate || null);
    const [tempStartDate, setTempStartDate] = useState<EthDateValue | null>(currentStartDate);
    const [tempEndDate, setTempEndDate] = useState<EthDateValue | null>(currentEndDate);
    const [hoverDate, setHoverDate] = useState<EthDateValue | null>(null);

    const [viewDate, setViewDate] = useState(startDate || currentDate);
    const [viewState, setViewState] = useState<ViewState>('date');
    const [yearRangeStart, setYearRangeStart] = useState<number>(Math.floor(currentDate.year / 12) * 12);

    useEffect(() => {
        if (value) {
            const uiVal = convertDate(value, isGreg);
            setCurrentDate(uiVal);
            setTempDate(uiVal);
            setViewDate(uiVal);
        }
    }, [value, isGreg]);

    useEffect(() => {
        if (selectsRange) {
            let changed = false;
            let newStart = currentStartDate;
            let newEnd = currentEndDate;
            
            if (currentStartDate) {
                const conv = convertDate(currentStartDate, isGreg);
                if (conv !== currentStartDate) { newStart = conv; changed = true; }
            }
            if (currentEndDate) {
                const conv = convertDate(currentEndDate, isGreg);
                if (conv !== currentEndDate) { newEnd = conv; changed = true; }
            }
            
            if (changed) {
                setCurrentStartDate(newStart);
                setTempStartDate(newStart);
                setCurrentEndDate(newEnd);
                setTempEndDate(newEnd);
                if (newStart) setViewDate(newStart);
                onChange?.([formatOutput(newStart), formatOutput(newEnd)]);
            }
        } else {
            if (currentDate) {
                const conv = convertDate(currentDate, isGreg);
                if (conv !== currentDate) {
                    setCurrentDate(conv);
                    setTempDate(conv);
                    setViewDate(conv);
                    onChange?.(formatOutput(conv));
                }
            }
        }
    }, [isGreg]);

    useEffect(() => {
        if (startDate !== undefined) {
            const uiStart = startDate ? convertDate(startDate, isGreg) : null;
            setCurrentStartDate(uiStart);
            setTempStartDate(uiStart);
            if (uiStart) setViewDate(uiStart);
        }
    }, [startDate, isGreg]);

    useEffect(() => {
        if (endDate !== undefined) {
            const uiEnd = endDate ? convertDate(endDate, isGreg) : null;
            setCurrentEndDate(uiEnd);
            setTempEndDate(uiEnd);
        }
    }, [endDate, isGreg]);

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
            setViewDate(currentDate);
        }
        setIsOpen(false);
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
        const baseDate = selectsRange ? (tempStartDate || tempDate) : tempDate;
        const newDate = { ...baseDate, year: viewDate.year, month: viewDate.month, day };
        
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
            setTempDate(prev => ({ ...prev, [field]: val }));
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
            const currentD = { year: viewDate.year, month: viewDate.month, day };
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
                isSelected = tempDate.year === viewDate.year && tempDate.month === viewDate.month && tempDate.day === day;
            }

            let classes = 'eth-dp-day';
            if (isSelected) classes += ' selected';
            if (isInRange || isHoverRange) classes += ' in-range';
            if (isRangeStart) classes += ' range-start';
            if (isRangeEnd) classes += ' range-end';

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    onMouseEnter={() => selectsRange && !tempEndDate && setHoverDate(currentD)}
                    className={classes}
                    type="button"
                >
                    {day}
                </button>
            );
        }

        const totalSlotsFilled = firstDay + daysInMonth;
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

    const formatTime = (hour?: number, min?: number, ampm?: EthAMPM | GregAMPM | string) => {
        if (!hour || !ampm) return '';
        const mm = (min || 0).toString().padStart(2, '0');
        
        if (isGreg) {
            return ` - ${hour}:${mm} ${ampm}`;
        } else {
            const greg = toGregorianTime(hour, min || 0, ampm as EthAMPM);
            const period = getEthTimePeriod(greg.hour);
            return ` - ${period} ${hour}:${mm}`;
        }
    };

    const activeMonths = isGreg ? gregMonths : ethMonths;
    const activeDays = isGreg ? gregDays : ethDays;
    const activeAMPMs = isGreg ? gregAMPMs : ethAMPMs;

    let formattedDisplay = placeholder;
    
    if (selectsRange) {
        const startStr = currentStartDate ? (isGreg ? `${currentStartDate.month}/${currentStartDate.day}/${currentStartDate.year}` : `${ethMonths[currentStartDate.month - 1]} ${currentStartDate.day}, ${currentStartDate.year}`) : "";
        const endStr = currentEndDate ? (isGreg ? `${currentEndDate.month}/${currentEndDate.day}/${currentEndDate.year}` : `${ethMonths[currentEndDate.month - 1]} ${currentEndDate.day}, ${currentEndDate.year}`) : "";
        if (startStr && endStr) formattedDisplay = `${startStr} - ${endStr}`;
        else if (startStr) formattedDisplay = startStr;
    } else {
        formattedDisplay = value || (currentDate.year && currentDate.month && currentDate.day) ? 
            `${activeMonths[currentDate.month - 1]} ${currentDate.day}, ${currentDate.year}${showTime ? formatTime(currentDate.hour, currentDate.minute, currentDate.ampm) : ''}` : 
            placeholder;
    }

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
        ...(customColors?.inRangeBg ? { '--eth-dp-in-range-bg': customColors.inRangeBg } : {}),
    } as React.CSSProperties;

    return (
        <div 
            className={`eth-dp-container eth-dp-theme-${theme} eth-dp-size-${size}`} 
            ref={containerRef}
            style={Object.keys(customStyles).length > 0 ? customStyles : undefined}
        >
            <input 
                type="text"
                readOnly
                className="eth-dp-input"
                value={formattedDisplay}
                onClick={(e) => {
                    if (!isOpen) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        
                        if (spaceBelow < 380 && spaceAbove > spaceBelow) {
                            setPopupPosition('top');
                        } else {
                            setPopupPosition('bottom');
                        }

                        setTempDate(currentDate);
                        setViewDate(currentDate);
                        setViewState('date');
                    }
                    setIsOpen(!isOpen);
                }}
            />

            {isOpen && (
                <div 
                    className="eth-dp-popup"
                    style={{
                        ...(popupPosition === 'top' ? { top: 'auto', bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)', bottom: 'auto' })
                    }}
                >
                    <div className="eth-dp-header">
                        <div className="eth-dp-header-left">
                            {viewState === 'date' && (
                                <>
                                    <span className="eth-dp-month-label" onClick={() => setViewState('month')}>
                                        {activeMonths[viewDate.month - 1]}
                                    </span>
                                    <span className="eth-dp-year-label" onClick={() => {
                                        setYearRangeStart(Math.floor(viewDate.year / 12) * 12);
                                        setViewState('year');
                                    }}>
                                        {viewDate.year}
                                    </span>
                                </>
                            )}
                            {viewState === 'month' && (
                                <span className="eth-dp-month-label" onClick={() => {
                                    setYearRangeStart(Math.floor(viewDate.year / 12) * 12);
                                    setViewState('year');
                                }}>
                                    {viewDate.year}
                                </span>
                            )}
                            {viewState === 'year' && (
                                <span className="eth-dp-month-label">
                                    {yearRangeStart} - {yearRangeStart + 11}
                                </span>
                            )}
                        </div>

                        <div className="eth-dp-header-right">
                            <button type="button" onClick={handlePrevious} className="eth-dp-icon-btn">
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <button type="button" onClick={handleNext} className="eth-dp-icon-btn">
                                <ChevronRight size={18} strokeWidth={2.5} />
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
                                        value={tempDate.hour || 12} 
                                        onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                    >
                                        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                            <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                    <span className="eth-dp-time-colon">:</span>
                                    <select 
                                        className="eth-dp-select"
                                        value={tempDate.minute || 0} 
                                        onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                    >
                                        {Array.from({length: 60}, (_, i) => i).map(m => (
                                            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                    <select 
                                        className="eth-dp-select"
                                        value={tempDate.ampm || activeAMPMs[0]} 
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
                                        <span className="eth-dp-range-time-label">Start Date</span>
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
                                        <span className="eth-dp-range-time-label">End Date</span>
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

                    {showActions && (
                        <div className="eth-dp-actions">
                            <button type="button" className="eth-dp-cancel-btn" onClick={handleCancel}>Cancel</button>
                            <button type="button" className="eth-dp-save-btn" onClick={handleSave}>Save</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
