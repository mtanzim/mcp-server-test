import * as dotenv from "dotenv";
dotenv.config();

const TOMORROW_API_KEY = process?.env?.["TOMORROW_API_KEY"];
const get_api_tomorrow_url = ({ lat, long }: { lat: string; long: string }) =>
  `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${long}&timestamps=1d&units=metric&apikey=${TOMORROW_API_KEY}`;

async function getWeather(url: string) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "accept-encoding": "deflate, gzip, br",
    },
  };

  const res = await fetch(url, options).then((res) => res.json());
  return res;
  const dailies = res?.timelines?.daily?.slice(0, 3);
  return dailies;
}

if (process.argv[1] === import.meta.filename) {
  const url = get_api_tomorrow_url({ lat: "43.6532", long: "79.3832" });
  console.log(url);

  const r = await getWeather(url);
  console.log(r);
}
