# vue-translator

[![Greenkeeper badge](https://badges.greenkeeper.io/JounQin/vue-translator.svg)](https://greenkeeper.io/)
[![Codecov](https://img.shields.io/codecov/c/github/JounQin/vue-translator.svg)](https://codecov.io/gh/JounQin/vue-translator)
[![Travis](https://img.shields.io/travis/JounQin/vue-translator.svg)](https://travis-ci.org/JounQin/vue-translator)
[![npm](https://img.shields.io/npm/dt/vue-translator.svg)](https://www.npmjs.com/package/vue-translator)
[![David](https://img.shields.io/david/JounQin/vue-translator.svg)](https://david-dm.org/JounQin/vue-translator)
[![David Dev](https://img.shields.io/david/dev/JounQin/vue-translator.svg)](https://david-dm.org/JounQin/vue-translator?type=dev)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A deadly simple i18n translate plugin for Vue, ready for Server Side Rendering.

## Demo

client side rendering: https://JounQin.github.io/vue-translator

server side rendering: https://rubick.1stg.me ([source code](https://github.com/JounQin/Rubick))

## Usage

```bash
yarn add vue-translator
```

### Basic Usage

```ts
import Vue from 'vue'
import VueTranslator from 'vue-translator'

Vue.use(VueTranslator, {
  locale?: string, // set it on initialize or before first rendering
  translations?: {  // If you want to define translations in component only, no need to set it on initialize
    [locale: string]: {
      [key:string]: string | array | object
    }
  },
  defaultLocale?: string, // when no value can be found in current locale, try to fallback to defaultLocale
  merge?: Function // `lodash.merge` for example, if you want to use component translator you must pass it
})
```

You will get a default translator instance on `Vue.translator`, it is safe to use it on client, but please avoid use it on server, be careful!

`translations` is often generated via `require.context` provided by `webpack` from `*.{locale}.i18n.json`:

```ts
const context = require.context('.', true, /([\w-]*[\w]+)\.i18n\.json$/)

const LOCALE_KEYS: { [key: string]: string[] } = {}

const translations: {
  [locale: string]: {
    [key: string]: string
  }
} = context.keys().reduce((modules: any, key: string) => {
  const module = context(key)
  const lang = key.match(/([\w-]*[\w]+)\.i18n\.json$/)[1]
  const matched = modules[lang] || (modules[lang] = {})

  if (process.env.NODE_ENV === 'development') {
    const keys = LOCALE_KEYS[lang] || (LOCALE_KEYS[lang] || [])
    const moduleKeys = Object.keys(module)

    const duplicates = _.intersection(keys, moduleKeys)

    if (duplicates.length) {
      console.warn('detect duplicate keys:', duplicates)
    }

    keys.push(...moduleKeys)
  }

  Object.assign(matched, module)
  return modules
}, {})
```

Then you will be able to use `$t` in all your component template.

```vue
<template>
  <div>
    {{ $t('message', obj_params?) }}
    {{ $t('nested.message', arr_params?) }}
  </div>
</template>
<script>
  export default {
    name: 'custom-component', // it is needed for better cache
    translator: {
      zh: {
        message: '我的信息'
      },
      en: {
        message: 'My Message'
      }
    }
  }
</script>
```

If you are trying to get a non-exist key or value is undefined, you will get a warning in console on development. And if you want to ignore it, pass a third parameter `ignoreNonExist: boolean`: `$t('non-exist-key', null, true)`.

If you want to watch locale change in any component, global watch should be defined on root component:

```js
new Vue({
  el: '#app',
  watch: {
    '$t.locale'(curr, prev) {
      // do something
    },
  },
})
```

Or you want to change locale on client:

```js
{
  methods: {
    changeLocale() {
      this.$t.locale = 'locale'
    }
  }
}
```

### SSR related

You'd better to detect user custom locale via cookie and fallback to [accept-language](https://github.com/tinganho/node-accept-language) on first request.

And you need to generate a single translator instance for every user request (cache by locale would be better) via `createTranslator`, `koa` for example:

```ts
import { createTranslator } from 'vue-translator'

app.use(async (ctx, next) => {
  const translator = createTranslator({
    locale: string, // ctx.cookies.get('locale_cookie')
    defaultLocale: string,
  })

  const context = {} // user context

  context.translator = translator

  // ... do anything
})
```

Then `$t` will be `translator` generated above, if you don't mind user's locale cookie and not pass `translator` instance into `user context`, it will fallback to the default `translator`.

Remember, always get translator instance via `this.$t` of `context.translator` instead of `Vue.translator` unless you are not handling user request.

## template syntax

Translation key should be string, but `.`(dot) will be parsed as nested key, it will also work in template!

```js
$t('a.b.c') // will try to find `a.b.c` on your custom transition, if a is falsy, will render undefined and try default locale

// render `nested value`
new Vue({
  translator: {
    en: {
      a: {
        b: {
          c: 'nested value',
        },
      },
    },
  },
})

// render `nested template`
$t('a.b', {c: d: 'nested template'})
new Vue({
  translator: {
    en: {
      a: {
        b: '{ c.d }'
      },
    },
  },
})
```

Array is also supported, `.index`(dot) or `[index]` can both be used!

```js
// nested with array key and template
// render `1`
$t('a.b[0]', [{ a: 1 }])

new Vue({
  translator: {
    en: {
      a: {
        b: ['{ 0.a }'], // do not use `[0].a` here, `0[a]` is also OK
      },
    },
  },
})
```

## Feature Request or Troubleshooting

Feel free to [create an issue](https://github.com/JounQin/vue-translator/issues/new).
