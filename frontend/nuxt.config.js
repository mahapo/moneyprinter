const colors = require('vuetify/es5/util/colors').default

module.exports = {
  target: 'static',
  // target: 'static',
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: '%s - ' + process.env.npm_package_name,
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || '',
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // components: true,

  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: ['@/plugins/vue-socket.client'],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    '@nuxtjs/composition-api',
    '@nuxt/typescript-build',
    // '@nuxt/components',
    // '@nuxtjs/stylelint-module',
    '@nuxtjs/vuetify',
  ],

  components: {
    dirs: [
      '~/components',
      {
        path: '~/components/Chart/',
        prefix: 'Chart',
      },
      {
        path: '~/components/Result/',
        prefix: 'Result',
      },
      {
        path: '~/components/Input/',
        prefix: 'Input',
      },
      {
        path: '~/components/Trade/',
        prefix: 'Trade',
      },
    ],
  },
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://content.nuxtjs.org/installation
    '@nuxt/content',
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    '@nuxtjs/firebase',
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {},
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      // dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
    },
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(_config, _ctx) {},
  },
  content: {
    // Options
  },

  router: {
    // middleware: 'router-auth',
  },

  firebase: {
    config: {
      apiKey: 'AIzaSyB4UFaCfUW9zfEefwcgseVlrKXjna31xC4',
      authDomain: 'moneyprinter-1337.firebaseapp.com',
      projectId: 'moneyprinter-1337',
      storageBucket: 'moneyprinter-1337.appspot.com',
      messagingSenderId: '485077092320',
      appId: '1:485077092320:web:f89f0ffffe171c68aa4d85',
    },
    services: {
      firestore: {
        // ...
        enablePersistence: true,
      },
      auth: {
        initialize: {
          onAuthStateChangedAction: 'auth/onAuthStateChanged',
        },
        ssr: false,
      },
    },
  },
}
