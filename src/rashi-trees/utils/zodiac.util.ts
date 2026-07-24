export interface ZodiacInfo {
  zodiacNumber: number;
  rashiName: string;
  rashiNameHindi: string;
}

interface ZodiacRange extends ZodiacInfo {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

/** Western sun-sign date ranges, ordered 1 (Aries) through 12 (Pisces), with
 * their common Hindi/Vedic Rashi names for display purposes. */
export const ZODIAC_RANGES: ZodiacRange[] = [
  { zodiacNumber: 1, rashiName: 'Aries', rashiNameHindi: 'मेष', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { zodiacNumber: 2, rashiName: 'Taurus', rashiNameHindi: 'वृषभ', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { zodiacNumber: 3, rashiName: 'Gemini', rashiNameHindi: 'मिथुन', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { zodiacNumber: 4, rashiName: 'Cancer', rashiNameHindi: 'कर्क', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { zodiacNumber: 5, rashiName: 'Leo', rashiNameHindi: 'सिंह', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { zodiacNumber: 6, rashiName: 'Virgo', rashiNameHindi: 'कन्या', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { zodiacNumber: 7, rashiName: 'Libra', rashiNameHindi: 'तुला', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { zodiacNumber: 8, rashiName: 'Scorpio', rashiNameHindi: 'वृश्चिक', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { zodiacNumber: 9, rashiName: 'Sagittarius', rashiNameHindi: 'धनु', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { zodiacNumber: 10, rashiName: 'Capricorn', rashiNameHindi: 'मकर', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { zodiacNumber: 11, rashiName: 'Aquarius', rashiNameHindi: 'कुंभ', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { zodiacNumber: 12, rashiName: 'Pisces', rashiNameHindi: 'मीन', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
];

const toInfo = (range: ZodiacRange): ZodiacInfo => ({
  zodiacNumber: range.zodiacNumber,
  rashiName: range.rashiName,
  rashiNameHindi: range.rashiNameHindi,
});

/** Resolves the (Western sun-sign) Rashi for a given date of birth. */
export function getZodiacFromDate(date: Date): ZodiacInfo {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const range of ZODIAC_RANGES) {
    const wrapsYearEnd = range.startMonth > range.endMonth;

    if (!wrapsYearEnd) {
      const afterStart = month > range.startMonth || (month === range.startMonth && day >= range.startDay);
      const beforeEnd = month < range.endMonth || (month === range.endMonth && day <= range.endDay);
      if (afterStart && beforeEnd) {
        return toInfo(range);
      }
    } else {
      const inStartMonth = month === range.startMonth && day >= range.startDay;
      const inEndMonth = month === range.endMonth && day <= range.endDay;
      if (inStartMonth || inEndMonth) {
        return toInfo(range);
      }
    }
  }

  throw new Error('Unable to determine zodiac sign for the given date');
}
