const toDateString = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const startOfDay = (value) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const endOfDay = (value) => {
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}

export const DATE_RANGE_PRESETS = [
  { value: "today", label: "Hari Ini" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "custom", label: "Custom" },
]

export const getDateRangeForPreset = (preset) => {
  const now = new Date()
  const endDate = toDateString(now)
  const start = new Date(now)

  if (preset === "30d") {
    start.setDate(start.getDate() - 29)
    return { startDate: toDateString(start), endDate }
  }

  if (preset === "7d") {
    start.setDate(start.getDate() - 6)
    return { startDate: toDateString(start), endDate }
  }

  return { startDate: endDate, endDate }
}

export const isWithinDateRange = (timestamp, startDate, endDate) => {
  if (!timestamp) return false

  const value = new Date(timestamp)
  if (Number.isNaN(value.getTime())) return false

  const startsAt = startDate ? startOfDay(startDate) : null
  const endsAt = endDate ? endOfDay(endDate) : null

  if (startsAt && value < startsAt) return false
  if (endsAt && value > endsAt) return false

  return true
}

export const formatDateRangeLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return "Semua tanggal"

  const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })
  const start = formatter.format(new Date(`${startDate}T00:00:00`))
  const end = formatter.format(new Date(`${endDate}T00:00:00`))

  return startDate === endDate ? start : `${start} - ${end}`
}
