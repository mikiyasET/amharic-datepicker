import { useState, useEffect } from 'react'
import { AmharicDatePicker, toEthiopian, toEthiopianTime, toGregorian, toGregorianTime, toGregorianTime12h, toGregorianTime24h, type EthDateValue } from 'amharic-datepicker'
import { Calendar as CalendarIcon, Terminal } from 'lucide-react'
import './App.css'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [calendarType, setCalendarType] = useState<'ethiopian' | 'gregorian'>('ethiopian')
  const [primaryColor, setPrimaryColor] = useState<string>('#0b7077')
  const [showTime, setShowTime] = useState<boolean>(true)
  const [showActions, setShowActions] = useState<boolean>(true)
  const [selectsRange, setSelectsRange] = useState<boolean>(false)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [customColors, setCustomColors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // New modern features
  const [allowManualInput, setAllowManualInput] = useState<boolean>(true)
  const [clearable, setClearable] = useState<boolean>(true)
  const [showTodayButton, setShowTodayButton] = useState<boolean>(true)
  const [useGeez, setUseGeez] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(false)
  const [readOnly, setReadOnly] = useState<boolean>(false)

  const [outputFormat, setOutputFormat] = useState<'ethiopian' | 'gregorian'>('ethiopian')

  const colorKeys = [
    { key: 'text', label: 'Text' },
    { key: 'selectedText', label: 'Selected Text' },
    { key: 'hoverBg', label: 'Hover BG' },
    { key: 'hoverText', label: 'Hover Text' },
    { key: 'selectedHoverText', label: 'Selected Hover Text' },
    { key: 'disabledText', label: 'Disabled Text' },
    { key: 'monthHeader', label: 'Month Header' },
    { key: 'saveBtnBg', label: 'Save Btn BG' },
    { key: 'saveBtnText', label: 'Save Btn Text' },
    { key: 'cancelBtnBg', label: 'Cancel Btn BG' },
    { key: 'cancelBtnText', label: 'Cancel Btn Text' },
    { key: 'todayBtnText', label: 'Today Btn Text' },
    { key: 'inRangeBg', label: 'In-Range BG' }
  ]

  const [date, setDate] = useState<EthDateValue | null>(() => {
    const now = new Date()
    const eDate = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const eTime = toEthiopianTime(now.getHours(), now.getMinutes())
    return { ...eDate, ...eTime }
  })

  const [rangeDates, setRangeDates] = useState<[EthDateValue | null, EthDateValue | null]>([null, null])

  // Automatically convert the UI's local state so the Terminal updates instantly when changing Output format
  useEffect(() => {
    const convertD = (d: EthDateValue | null, targetFormat: 'ethiopian' | 'gregorian'): EthDateValue | null => {
      if (!d) return null
      const isEth = d.month === 13 || d.ampm === 'ቀን' || d.ampm === 'ማታ' || d.ampm === 'ንጋት' || d.ampm === 'ጠዋት' || d.ampm === 'ከሰዓት' || d.ampm === 'ወደ ማታ' || d.ampm === 'ምሽት' || d.ampm === 'ሌሊት' || d.ampm === 'እኩለ ሌሊት'
      const isGreg = !isEth

      if (targetFormat === 'gregorian' && isEth) {
        const greg = toGregorian(d.year, d.month, d.day)
        const gTime = toGregorianTime(d.hour || 1, d.minute || 0, (d.ampm as any) || 'ቀን')
        const gTime12 = toGregorianTime12h(gTime.hour)
        return { ...d, year: greg.year, month: greg.month, day: greg.day, hour: gTime12.hour, minute: gTime.minute, ampm: gTime12.ampm }
      }
      if (targetFormat === 'ethiopian' && isGreg) {
        const eth = toEthiopian(d.year, d.month, d.day)
        const gTime24 = toGregorianTime24h(d.hour || 12, (d.ampm as any) || 'AM')
        const ethTime = toEthiopianTime(gTime24, d.minute || 0)
        return { ...d, year: eth.year, month: eth.month, day: eth.day, hour: ethTime.hour, minute: ethTime.minute, ampm: ethTime.ampm }
      }
      return d
    }

    if (date) setDate(prev => convertD(prev, outputFormat))
    setRangeDates(prev => [
      convertD(prev[0], outputFormat),
      convertD(prev[1], outputFormat)
    ])
  }, [outputFormat])

  return (
    <div className={`layout ${theme}`}>
      {/* Fixed Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <h1>Amharic Date Picker</h1>
          <p>v1.1.0 • Modernized & Editable</p>
        </div>

        <div className="sidebar-content">
          <div className="control-group">
            <span className="control-group-title">Environment</span>
            <select className="modern-select" value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
            <select className="modern-select" value={calendarType} onChange={(e) => setCalendarType(e.target.value as 'ethiopian' | 'gregorian')}>
              <option value="ethiopian">UI: Ethiopian (ግዕዝ / Amharic)</option>
              <option value="gregorian">UI: Gregorian (Western)</option>
            </select>
            <select className="modern-select" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as 'ethiopian' | 'gregorian')}>
              <option value="ethiopian">Output: Ethiopian</option>
              <option value="gregorian">Output: Gregorian</option>
            </select>
          </div>

          <div className="control-group">
            <span className="control-group-title">Component Props</span>
            <select className="modern-select" value={size} onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}>
              <option value="small">Size: Small</option>
              <option value="medium">Size: Medium (Default)</option>
              <option value="large">Size: Large</option>
            </select>

            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={allowManualInput} onChange={(e) => setAllowManualInput(e.target.checked)} />
              <span>Allow Manual Typing (Editable)</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={clearable} onChange={(e) => setClearable(e.target.checked)} />
              <span>Clearable (× Button)</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={showTodayButton} onChange={(e) => setShowTodayButton(e.target.checked)} />
              <span>Show "Today" Jump Button</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={useGeez} onChange={(e) => setUseGeez(e.target.checked)} />
              <span>Ge'ez Numerals (፩, ፪, ፫...)</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={showTime} onChange={(e) => setShowTime(e.target.checked)} />
              <span>Show Time Selection</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={showActions} onChange={(e) => setShowActions(e.target.checked)} />
              <span>Show Action Bar (Save/Cancel)</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={selectsRange} onChange={(e) => setSelectsRange(e.target.checked)} />
              <span>Range Selection Mode</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
              <span>Disabled</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" className="modern-checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
              <span>ReadOnly Input</span>
            </label>
          </div>

          <div className="control-group">
            <span className="control-group-title">Theming & Brand</span>
            <div className="color-row">
              <input type="color" className="color-picker" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              <span className="color-value">{primaryColor}</span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                <span>Advanced Color Overrides</span>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{showAdvanced ? '−' : '+'}</span>
              </div>

              {showAdvanced && (
                <div className="advanced-panel">
                  {colorKeys.map(({ key, label }) => (
                    <div className="adv-color-item" key={key}>
                      <span>{label}</span>
                      <div className="adv-color-controls">
                        <input
                          type="color"
                          className="color-picker"
                          style={{ width: '20px', height: '20px' }}
                          value={customColors[key] || '#000000'}
                          onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                        <button
                          className="btn-clear"
                          onClick={() => setCustomColors(prev => {
                            const next = { ...prev }
                            delete next[key]
                            return next
                          })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="preview-header">
          <CalendarIcon size={20} color={theme === 'dark' ? '#34d399' : '#0b7077'} />
          <h2>Interactive Preview</h2>
        </header>

        <div className="preview-body">
          <div className="component-wrapper" style={{ width: size === 'large' ? '360px' : size === 'medium' ? '320px' : '270px', transition: 'width 0.3s ease' }}>
            {selectsRange ? (
              <AmharicDatePicker
                selectsRange={true}
                startDate={rangeDates[0]}
                endDate={rangeDates[1]}
                onChange={(val) => setRangeDates(val)}
                showTime={showTime}
                showActions={showActions}
                theme={theme}
                calendarType={calendarType}
                outputFormat={outputFormat}
                primaryColor={primaryColor}
                customColors={customColors}
                size={size}
                allowManualInput={allowManualInput}
                clearable={clearable}
                showTodayButton={showTodayButton}
                useGeez={useGeez}
                disabled={disabled}
                readOnly={readOnly}
                placeholder="ቀን ይምረጡ / Select Date Range..."
              />
            ) : (
              <AmharicDatePicker
                value={date}
                onChange={setDate}
                showTime={showTime}
                showActions={showActions}
                theme={theme}
                calendarType={calendarType}
                outputFormat={outputFormat}
                primaryColor={primaryColor}
                customColors={customColors}
                size={size}
                allowManualInput={allowManualInput}
                clearable={clearable}
                showTodayButton={showTodayButton}
                useGeez={useGeez}
                disabled={disabled}
                readOnly={readOnly}
                placeholder="ቀን ይምረጡ / Select Date..."
              />
            )}
          </div>
        </div>

        {/* Terminal/State Output Panel */}
        <div className="code-panel">
          <div className="code-panel-header">
            <Terminal size={16} color="#94a3b8" />
            <span>STATE OBSERVER</span>
          </div>
          <div className="code-content">
            {selectsRange ? (
              <>
                <div className="code-comment">// Selected Range Array [startDate, endDate]</div>
                {'['}
                <br />
                &nbsp;&nbsp;{rangeDates[0] ? JSON.stringify(rangeDates[0]) : 'null'},
                <br />
                &nbsp;&nbsp;{rangeDates[1] ? JSON.stringify(rangeDates[1]) : 'null'}
                <br />
                {']'}
              </>
            ) : (
              <>
                <div className="code-comment">// Selected Single Date Object</div>
                {date ? JSON.stringify(date, null, 2) : 'null'}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
