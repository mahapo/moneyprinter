import * as chartControllers from './controller/chart'
import * as snakeCase from 'lodash/snakeCase'

/**
 * All chart routes.
 */
export const ChartRoutes = Object.keys(chartControllers).map(key => ({
  path: `/chart/${snakeCase(key)}`,
  method: 'get',
  action: chartControllers[key]
}))
