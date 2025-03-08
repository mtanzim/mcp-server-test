import * as dotenv from "dotenv";
import { z } from "zod";

type GeoLocation = { lat: string; long: string };

const TOMORROW_API_KEY = process?.env?.["TOMORROW_API_KEY"];
const getApiTomorrowUrl = ({ lat, long }: GeoLocation) =>
  `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${long}&timestamps=1d&units=metric&apikey=${TOMORROW_API_KEY}`;

const ForecastSchema = z.object({
  day: z.string(),
  tempMin: z.number(),
  tempMax: z.number(),
  precipitationChance: z.number(),
  tempUnit: z.string(),
});
type Forecast = z.infer<typeof ForecastSchema>;

async function getWeatherForecast(url: string): Promise<Forecast[]> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "accept-encoding": "deflate, gzip, br",
    },
  };

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(
      `cannot get weather forecast, statusCode: ${res.statusText}, text:${res.text}`
    );
  }
  const json = await res.json();
  const dailies: Forecast[] = json?.timelines?.daily
    ?.slice(0, 3)
    .map((d: any) => ({
      day: d?.time?.split("T")?.[0],
      tempMin: d?.values?.temperatureMin,
      tempMax: d?.values?.temperatureMax,
      precipitationChance: d?.values?.precipitationProbabilityAvg,
      tempUnit: "C",
    }))
    .map((d: unknown) => ForecastSchema.safeParse(d)?.data)
    .filter(Boolean);
  return dailies;
}

function formatWeatherForecast(fs: Forecast[]): string {
  const days = fs.map(
    (f) => `\
Forecast for ${f.day.slice(0)} is as follows:
The minimum temperature is ${f.tempMin.toFixed(0)} degrees ${f.tempUnit}.\
The maximum temperature is ${f.tempMax.toFixed(0)} degrees ${f.tempUnit}.\
There is a ${f.precipitationChance.toFixed(0)}% chance of rain.`
  );
  return `The forecast for the next 3 days is as follows:\n${days.join("\n")}`;
}

export async function getTomorrowWeatherForecast(gl: GeoLocation) {
  return getWeatherForecast(getApiTomorrowUrl(gl)).then(formatWeatherForecast);
}

if (process.argv[1] === import.meta.filename) {
  dotenv.config();
  const toronto: GeoLocation = { lat: "43.6532", long: "79.3832" };

  console.log(await getTomorrowWeatherForecast(toronto));
}
