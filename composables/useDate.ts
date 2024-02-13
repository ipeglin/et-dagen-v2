// Check if date is valid and matches YYYY-MM-DD format
export const isValidDate = (date: string): boolean => {
  // Check if date matches date regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date.split('T')[0])) {
    return false
  }

  // Check if date is valid
  const dateObject = new Date(date)
  if (dateObject.toString() === 'Invalid Date') {
    return false
  }

  return true
}

// Check if two dates are of the same month
export const isSameMonth = (date1: string, date2: string): boolean => {
  const date1Object = new Date(date1)
  const date2Object = new Date(date2)

  return (
    date1Object.getMonth() === date2Object.getMonth() &&
    date1Object.getFullYear() === date2Object.getFullYear()
  )
}

const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'november',
  'december',
]

const weekdays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const getWeekdayFromDateTime = (datetime: string): string => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$i18n.t(`weekday.${weekdays[new Date(datetime).getDay()]}`)
}

// Get month name from month index
export const getFullMonthFromNumber = (month: number): string => {
  const nuxtApp = useNuxtApp()
  const monthName = months[month]
  return nuxtApp.$i18n.t(`datetime.months.${monthName}`)
}

// Get date and month string from datetime string. Format: DD/MM
export const getNumericDayAndMonthString = (datetime: string): {} => {
  const date = new Date(datetime)
  const day = date.getDate()
  const month = date.getMonth() + 1

  return `${day < 10 ? `0${day}` : day}/${month + 1 < 10 ? `0${month}` : month}`
}

export const getDayAndMonthString = (
  datetime: string,
  shortenMonth = false
) => {
  const date = new Date(datetime)

  const day = date.getDate()
  const month = getFullMonthFromNumber(date.getMonth())

  const formattedMonth = shortenMonth ? month.substring(0, 3) : month

  return `${day}. ${formattedMonth}`
}

// Get date string YYYY-MM-DD from datetime string YYYY-MM-DDThh:mm:ssZ
export const getDateFromDatetime = (datetime: string): string => {
  return datetime.split('T')[0]
}
