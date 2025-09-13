import { env } from "process";


interface Secrets {
  Port: number | string;
}

export const  secrets: Secrets = {
  Port: env.MAIN_APP_PORT!,
}