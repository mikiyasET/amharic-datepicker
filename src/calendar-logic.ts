const JD_EPOCH_OFFSET_AMETE_MIHRET = 1724220;
const JD_OFFSET = 1;

export function gregToJDN(year: number, month: number, day: number): number {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    return day + Math.floor((153 * m + 2) / 5) +
           365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function jdnToGreg(jdn: number): { year: number; month: number; day: number } {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor(1461 * d / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = b * 100 + d - 4800 + Math.floor(m / 10);

    return { year, month, day };
}

export function ethToJDN(year: number, month: number, day: number): number {
    const leapDays = Math.floor((year - 1) / 4);
    const daysInYear = 30 * (month - 1) + (day - 1);

    return JD_EPOCH_OFFSET_AMETE_MIHRET +
           365 * (year - 1) +
           leapDays +
           daysInYear;
}

export function isEthiopianLeapYear(year: number): boolean {
    return (year - 2015) % 4 === 0;
}

export function jdnToEth(jdn: number): { year: number; month: number; day: number } {
    const r = jdn - JD_EPOCH_OFFSET_AMETE_MIHRET;
    const year = Math.floor((r + 366) / 365.25);

    const newYearJDN = ethToJDN(year, 1, 1);
    const daysPassed = jdn - newYearJDN;

    if (daysPassed < 0) {
        return jdnToEth(jdn - 1);
    }

    const leap = isEthiopianLeapYear(year);
    const maxDays = leap ? 366 : 365;

    if (daysPassed >= maxDays) {
        return jdnToEth(jdn + 1);
    }

    let month, day;

    if (daysPassed < 30 * 12) {
        month = Math.floor(daysPassed / 30) + 1;
        day = (daysPassed % 30) + 1;
    } else {
        month = 13;
        day = daysPassed - 30 * 12 + 1;

        const maxPagumeDays = leap ? 6 : 5;
        if (day > maxPagumeDays) {
            throw new Error(`Invalid Pagume day: ${day} (max is ${maxPagumeDays})`);
        }
    }

    return { year, month, day };
}

export function toGregorian(
    ethYear: number,
    ethMonth: number,
    ethDay: number
): { year: number; month: number; day: number } {
    const jdnEth = ethToJDN(ethYear, ethMonth, ethDay);
    const jdnGreg = jdnEth + JD_OFFSET;
    return jdnToGreg(jdnGreg);
}

export function toEthiopian(
    gregYear: number,
    gregMonth: number,
    gregDay: number
): { year: number; month: number; day: number } {
    const jdnGreg = gregToJDN(gregYear, gregMonth, gregDay);
    const jdnEth = jdnGreg - JD_OFFSET;
    return jdnToEth(jdnEth);
}

export const ethMonths = [
    "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
    "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
];

export const ethDays = [
    "እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"
];

export function getFirstDayOfMonth(year: number, month: number): number {
    const jdn = ethToJDN(year, month, 1);
    const greg = jdnToGreg(jdn + JD_OFFSET);
    const date = new Date(greg.year, greg.month - 1, greg.day);
    return date.getDay();
}

export function getDaysInMonth(year: number, month: number): number {
    if (month === 13) {
        return isEthiopianLeapYear(year) ? 6 : 5;
    }
    return 30;
}

export type EthAMPM = 'ቀን' | 'ማታ';
export type EthTimePeriod = 'ጠዋት' | 'ከሰዓት' | 'ምሽት' | 'ሌሊት';

export const ethAMPMs: EthAMPM[] = ['ቀን', 'ማታ'];

export function getEthTimePeriod(gregHour: number): EthTimePeriod {
    if (gregHour >= 6 && gregHour < 12) return 'ጠዋት';
    if (gregHour >= 12 && gregHour < 18) return 'ከሰዓት';
    if (gregHour >= 18 && gregHour < 24) return 'ምሽት';
    return 'ሌሊት';
}

export function toEthiopianTime(gregHour: number, gregMinute: number): { hour: number, minute: number, ampm: EthAMPM } {
    const ampm: EthAMPM = (gregHour >= 6 && gregHour < 18) ? 'ቀን' : 'ማታ';

    let ethHour = (gregHour + 6) % 12;
    if (ethHour === 0) ethHour = 12;

    return { hour: ethHour, minute: gregMinute, ampm };
}

export function toGregorianTime(ethHour: number, ethMinute: number, ampm: EthAMPM): { hour: number, minute: number } {
    let gregHour = ethHour + 6;
    if (ethHour === 12) {
        gregHour = 6;
    }
    
    if (ampm === 'ማታ') {
        gregHour += 12;
    }
    
    gregHour = gregHour % 24;
    return { hour: gregHour, minute: ethMinute };
}

// Gregorian Helpers for the date picker
export const gregMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const gregDays = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export type GregAMPM = 'AM' | 'PM';
export const gregAMPMs: GregAMPM[] = ['AM', 'PM'];

export function getGregFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
}

export function getGregDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

export function toGregorianTime12h(hour24: number): { hour: number, ampm: GregAMPM } {
    const ampm: GregAMPM = hour24 >= 12 ? 'PM' : 'AM';
    let hour = hour24 % 12;
    if (hour === 0) hour = 12;
    return { hour, ampm };
}

export function toGregorianTime24h(hour12: number, ampm: GregAMPM): number {
    let hour24 = hour12;
    if (ampm === 'PM' && hour12 < 12) hour24 += 12;
    if (ampm === 'AM' && hour12 === 12) hour24 = 0;
    return hour24;
}
