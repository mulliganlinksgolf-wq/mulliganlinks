import SunCalc from 'suncalc'

export type SunTimes = {
  sunrise: Date
  sunset: Date
  firstBookable: Date
  lastBookable: Date
}

export type ComputeSunTimesInput = {
  date: Date
  latitude: number
  longitude: number
  sunriseOffsetMinutes: number
  sunsetOffsetMinutes: number
}

export function computeSunTimes(input: ComputeSunTimesInput): SunTimes {
  const { date, latitude, longitude, sunriseOffsetMinutes, sunsetOffsetMinutes } = input
  const times = SunCalc.getTimes(date, latitude, longitude)

  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    firstBookable: roundToTenMinutes(times.sunrise, sunriseOffsetMinutes),
    lastBookable: roundToTenMinutes(times.sunset, sunsetOffsetMinutes),
  }
}

function roundToTenMinutes(d: Date, offsetMinutes: number): Date {
  const adjusted = new Date(d.getTime() + offsetMinutes * 60_000)
  const minutes = adjusted.getMinutes()
  adjusted.setMinutes(Math.round(minutes / 10) * 10, 0, 0)
  return adjusted
}
