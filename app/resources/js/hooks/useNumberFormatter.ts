import { useMemo } from 'react'

interface NumberFormatConfig {
  decimalSeparator: string
  thousandsSeparator: string
  maxFractionDigits: number
}

const DEFAULT_NUMBER_FORMAT_CONFIG: NumberFormatConfig = {
  decimalSeparator: ',',
  thousandsSeparator: '.',
  maxFractionDigits: 2,
}

const parseNumber = (value: string | number, config: NumberFormatConfig): number => {
  if (typeof value === 'number') return value

  const raw = String(value ?? '').trim()
  if (!raw) return Number.NaN

  const sanitized = raw.replace(/\s+/g, '')
  const hasComma = sanitized.includes(config.decimalSeparator)

  let normalized = sanitized
  if (hasComma) {
    normalized = normalized
      .split(config.thousandsSeparator).join('')
      .replace(config.decimalSeparator, '.')
  }

  normalized = normalized.replace(/[^0-9.-]/g, '')

  if ((normalized.match(/\./g) ?? []).length > 1) {
    const [first, ...rest] = normalized.split('.')
    normalized = `${first}.${rest.join('')}`
  }

  return Number.parseFloat(normalized)
}

const formatNumber = (value: number | string, config: NumberFormatConfig): string => {
  const parsed = parseNumber(value, config)
  if (Number.isNaN(parsed)) return String(value ?? '')

  const hasDecimals = parsed % 1 !== 0
  const decimalPlaces = hasDecimals ? config.maxFractionDigits : 0
  const fixed = parsed.toFixed(decimalPlaces)
  const [integerPart, decimalPart] = fixed.split('.')
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator)

  if (hasDecimals && decimalPart) {
    return `${formattedInteger}${config.decimalSeparator}${decimalPart}`
  }

  return formattedInteger
}

export const useNumberFormatter = () => {
  const config = DEFAULT_NUMBER_FORMAT_CONFIG

  return useMemo(() => ({
    config,
    parse: (value: string | number) => parseNumber(value, config),
    format: (value: string | number) => formatNumber(value, config),
  }), [config])
}
