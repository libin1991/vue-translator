// tslint:disable-next-line no-unused-variable
import Vue, { VueConstructor } from 'vue'

import { Translations, createTranslator } from './translator'

export * from './translator'

export interface TranslatorOptions {
  defaultLocale?: string
  locale: string
  merge?: (prev: Translations, next: Translations) => Translations
  translations?: Translations
}

const mergedCache: string[] = []

export default (
  $Vue: VueConstructor,
  { defaultLocale, locale, merge, translations = {} }: TranslatorOptions,
) => {
  const defaultTranslator = createTranslator(
    locale,
    translations,
    defaultLocale,
  )

  const { warn } = $Vue.util

  Vue.mixin({
    beforeCreate() {
      const { name, translator } = this.$options

      if (!translator || mergedCache.includes(name)) {
        return
      }

      if (!merge) {
        if (process.env.NODE_ENV === 'development') {
          warn(
            'VueTranslator will not help you to merge translations, please pass your own merge strategy, `lodash.merge` for example',
          )
        }
        return
      }

      merge(translations, translator)

      if (name) {
        mergedCache.push(name)
      } else if (process.env.NODE_ENV === 'development') {
        warn('you should define a unique component name for better cache')
      }
    },
  })

  Object.defineProperty(
    $Vue.prototype,
    '$t',
    process.env.VUE_ENV === 'server'
      ? {
          get() {
            const { translator } = this.$ssrContext

            if (process.env.NODE_ENV === 'development' && !translator) {
              $Vue.util.warn(
                'there is no translator instance on ssrContext, you should register it manually',
              )
            }

            return translator || defaultTranslator
          },
          configurable: process.env.NODE_ENV === 'development',
        }
      : {
          value: defaultTranslator,
          writable: process.env.NODE_ENV === 'development',
        },
  )
}