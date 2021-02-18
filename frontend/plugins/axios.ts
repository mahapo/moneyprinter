import { cacheAdapterEnhancer } from "axios-extensions"
import LRU from "lru-cache"

const ONE_HOUR = 1000 * 60 * 60

export default function ({ $axios, redirect, ssrContext }) {
  $axios.onRequest(config => {
    console.log('Making request to ' + config.url)
  })

  $axios.onError(error => {
    const code = parseInt(error.response && error.response.status)
    if (code === 400) {
      redirect('/400')
    }
  })

  // @ts-ignore
  const defaultCache = process.server
    ? ssrContext.$axCache
    : new LRU({ maxAge: ONE_HOUR })

  const defaults = $axios.defaults
  // https://github.com/kuitos/axios-extensions
  defaults.adapter = cacheAdapterEnhancer(defaults.adapter, {
    enabledByDefault: false,
    cacheFlag: "useCache",
    defaultCache
  })
}
