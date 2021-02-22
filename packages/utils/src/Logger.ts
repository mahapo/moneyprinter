// import * as winston from 'winston'
// // import Sentry from 'winston-transport-sentry-node'

// const options = {
//   // sentry: {
//   //   dsn: 'https://4a350580542f46bdb422be3fe3db3901@o395422.ingest.sentry.io/5247177',
//   // },
//   level: 'warn'
// }

// //
// // Logging levels
// //
// const config = {
//   levels: {
//     error: 0,
//     debug: 1,
//     warn: 2,
//     data: 3,
//     info: 4,
//     verbose: 5,
//     silly: 6,
//     custom: 7
//   },
//   colors: {
//     error: 'red',
//     debug: 'blue',
//     warn: 'yellow',
//     data: 'grey',
//     info: 'green',
//     verbose: 'cyan',
//     silly: 'magenta',
//     custom: 'yellow'
//   }
// }

// winston.addColors(config.colors)

// export const Logger = winston.createLogger({
//   levels: config.levels,
//   format: winston.format.combine(
//     winston.format.colorize(),
//     winston.format.simple()
//   ),
//   transports: [
//     new winston.transports.Console()
//     // new Sentry(options)
//   ],
//   level: 'custom'
// })

export const Logger = {
  info: (...args) => {
    console.info(...args)
  },
  error: (...args) => {
    console.error(...args)
  }
}
