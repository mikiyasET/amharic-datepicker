# Amharic Date Picker

![Amharic Date Picker](https://raw.githubusercontent.com/mikiyasET/amharic-datepicker/main/assets/am-datepicker.jpg)

A modern, highly customizable, and beautiful React component for selecting Amharic (Ethiopian) dates and Gregorian dates. Built with zero heavy external calendar dependencies, powered by [`amharic-datepicker-utils`](https://www.npmjs.com/package/amharic-datepicker-utils).

> **Looking for the backend/logic-only package?** Use [`amharic-datepicker-utils`](https://www.npmjs.com/package/amharic-datepicker-utils) — the pure TypeScript astronomical conversion logic with zero UI or framework dependencies. This package (`amharic-datepicker`) depends on it automatically and re-exports all its functions.

---

## What's New in v1.1.0 🚀

- **Editable & Manual Typing (`allowManualInput`):** Directly type dates into the input field in Amharic (e.g. `መስከረም 1, 2017`) or standard numerical formats (`01/01/2017`, `2017-01-01`). Auto-validates and commits on Enter or Blur.
- **Clear Button (`clearable`):** Instant clear button (`×`) to reset selection.
- **"Today" Quick Jump (`showTodayButton`):** One-click button (`ዛሬ` / `Today`) to navigate and select the current day.
- **Real-World "Today" Indicator:** Calendar grid visually marks the current day with a subtle dot indicator so users never lose orientation.
- **Ge'ez Numerals (`useGeez`):** Optionally display day numbers using traditional Ge'ez numerals (`፩`, `፪`, `፫`, `፲`, `፳`, `፴`...).
- **Date Range Restrictions (`minDate` & `maxDate`):** Disable dates outside an allowed range.
- **Flexible Value Types (`DatePickerValue`):** Pass `EthDateValue`, native JavaScript `Date`, or date strings seamlessly.
- **Updated to `amharic-datepicker-utils@^1.1.0`:** Powered by verified astronomical JDN algorithms with 100% leap year and Pagume accuracy.
- **Refined Modern Styling:** Redesigned inputs, rounded cards, smooth drop-shadows, and enhanced dark mode palette.

---

## Installation

```bash
# npm
npm install amharic-datepicker

# pnpm
pnpm add amharic-datepicker

# yarn
yarn add amharic-datepicker

# bun
bun add amharic-datepicker
```

> **Note:** Requires React 18 or 19 (`react` and `react-dom` as peer dependencies). Styles are bundled and injected automatically — no extra `.css` imports required!

---

## Quick Start

### Basic Usage

```tsx
import React, { useState } from 'react';
import { AmharicDatePicker, type EthDateValue, toEthiopian } from 'amharic-datepicker';

function App() {
  const [date, setDate] = useState<EthDateValue | null>(() => {
    const now = new Date();
    return toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  });

  return (
    <div style={{ padding: 20 }}>
      <h3>Pick an Ethiopian Date</h3>
      <AmharicDatePicker 
        value={date} 
        onChange={setDate}
        clearable={true}
        allowManualInput={true}
      />
      {date && (
        <p>Selected: {date.year}/{date.month}/{date.day}</p>
      )}
    </div>
  );
}

export default App;
```

---

## Key Features & Examples

### 1. Manual Typing & Editable Input
Users can type dates directly into the input. Pressing **Enter** or clicking away (**blur**) parses and validates the date automatically:

```tsx
<AmharicDatePicker 
  value={date}
  onChange={setDate}
  allowManualInput={true} // Enabled by default
  placeholder="Type e.g. መስከረም 1, 2017 or 01/01/2017"
/>
```

### 2. Traditional Ge'ez Numerals
Display calendar dates in authentic Ethiopian Ge'ez digits:

```tsx
<AmharicDatePicker 
  value={date}
  onChange={setDate}
  useGeez={true} // Renders ፩, ፪, ፫ ... ፴
/>
```

### 3. Quick "Today" Jump Button
Jump instantly to today's Ethiopian date:

```tsx
<AmharicDatePicker 
  value={date}
  onChange={setDate}
  showTodayButton={true} // Adds "ዛሬ" button in action bar
/>
```

### 4. Min & Max Date Constraints
Restrict the selectable date range:

```tsx
<AmharicDatePicker 
  value={date}
  onChange={setDate}
  minDate={{ year: 2017, month: 1, day: 1 }}
  maxDate={new Date()} // Can also be a JS Date or string
/>
```

### 5. Date Range Selection
Select a start and end date range:

```tsx
function RangeExample() {
  const [range, setRange] = useState<[EthDateValue | null, EthDateValue | null]>([null, null]);

  return (
    <AmharicDatePicker 
      selectsRange={true}
      startDate={range[0]}
      endDate={range[1]}
      onChange={setRange}
      placeholder="Select Date Range..."
    />
  );
}
```

### 6. Time Selection
Enable Ethiopian 12-hour time or Gregorian time:

```tsx
<AmharicDatePicker 
  value={date}
  onChange={setDate}
  showTime={true}
  calendarType="ethiopian" // Ethiopian time (ጠዋት, ከሰዓት, ማታ...)
/>
```

### 7. Dual Calendar (Ethiopian & Gregorian)
Switch between Ethiopian (Amharic) and Gregorian calendars on the fly:

```tsx
<AmharicDatePicker 
  calendarType="gregorian" // UI renders Western Gregorian calendar
  outputFormat="ethiopian"  // Automatically converts emitted value to Ethiopian!
/>
```

### 8. Dark Mode & Custom Colors
Supports modern Dark Mode out of the box and full custom theme tokens:

```tsx
<AmharicDatePicker 
  theme="dark"
  primaryColor="#10b981" // Custom primary emerald accent
  customColors={{
    hoverBg: '#1f2937',
    monthHeader: '#f9fafb',
    saveBtnBg: '#10b981',
  }}
/>
```

---

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `DatePickerValue` | `today` | The currently selected date (`EthDateValue`, `Date`, string, or `null`) |
| `onChange` | `(value: any) => void` | — | Callback when date or time is selected or changed |
| `allowManualInput` | `boolean` | `true` | Allows typing dates directly into the input field |
| `clearable` | `boolean` | `false` | Shows a clear (`×`) button when a date is selected |
| `showTodayButton` | `boolean` | `true` | Shows quick "ዛሬ / Today" jump button in the actions bar |
| `showCalendarIcon` | `boolean` | `true` | Shows calendar icon inside the input |
| `useGeez` | `boolean` | `false` | Renders calendar day numbers as Ge'ez numerals (`፩`, `፪`...) |
| `minDate` | `DatePickerValue` | `undefined` | Disables dates before this date |
| `maxDate` | `DatePickerValue` | `undefined` | Disables dates after this date |
| `placeholder` | `string` | `"ቀን ይምረጡ / Select Date"` | Placeholder text for input |
| `calendarType` | `'ethiopian' \| 'gregorian'` | `'ethiopian'` | Calendar system used by the UI |
| `outputFormat` | `'ethiopian' \| 'gregorian'` | `undefined` | Forces emitted `onChange` value to convert to this format |
| `showTime` | `boolean` | `false` | Whether to show the time picker section |
| `showActions` | `boolean` | `true` | Show or hide the Save / Cancel action bar |
| `selectsRange` | `boolean` | `false` | Enable date range selection mode |
| `startDate` | `DatePickerValue` | `null` | Start date for range selection |
| `endDate` | `DatePickerValue` | `null` | End date for range selection |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Sizing scale for the input and dropdown |
| `theme` | `'light' \| 'dark'` | `'light'` | Toggle between light and dark modes |
| `primaryColor` | `string` | `"#0b7077"` | Brand accent color |
| `customColors` | `CustomColors` | `{}` | Detailed color token overrides (see below) |
| `disabled` | `boolean` | `false` | Disables interaction and dims appearance |
| `readOnly` | `boolean` | `false` | Prevents manual typing while still allowing popup selection |
| `className` | `string` | `""` | Custom CSS class on container wrapper |
| `inputClassName` | `string` | `""` | Custom CSS class on input field |
| `popupClassName` | `string` | `""` | Custom CSS class on dropdown popup |

---

## TypeScript Types

### `EthDateValue`

```typescript
export interface EthDateValue {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  ampm?: 'ቀን' | 'ማታ' | 'ጠዋት' | 'ከሰዓት' | 'ምሽት' | 'ሌሊት' | 'AM' | 'PM' | string;
}
```

### `DatePickerValue`

```typescript
export type DatePickerValue = EthDateValue | Date | string | null | undefined;
```

### `CustomColors`

```typescript
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
```

---

## Re-exported Utility Functions

All calendar functions from [`amharic-datepicker-utils`](https://www.npmjs.com/package/amharic-datepicker-utils) are directly exported by this package:

```typescript
import { 
  toEthiopian, 
  toGregorian, 
  toGregorianDate,
  formatEthiopian,
  parseEthiopianDate,
  toGeez,
  fromGeez,
  ethMonths, 
  ethDays,
  compareEthDates
} from 'amharic-datepicker';

// Format Ethiopian date with tokens
formatEthiopian({ year: 2017, month: 1, day: 1 }, 'MMMM DD, YYYY');
// => "መስከረም 01, 2017"

// Convert numbers to Ge'ez numerals
toGeez(2017); // => "፳፻፲፯"
toGeez(1);    // => "፩"
```

---

## Running the Example Locally

The repository includes a playground demo app:

```bash
# 1. Build the library
npm install
npm run build

# 2. Run the example app
cd example
npm install
npm run dev
```

---

## License

MIT © [Mikiyas Lemlemu](https://github.com/mikiyasET) • Powered by [Codeabay](https://codeabay.com)
