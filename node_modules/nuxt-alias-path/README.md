<!-- TITLE/ -->
# nuxt-alias-path
<!-- /TITLE -->

<!-- BADGES/ -->
  <p>
    <a href="https://npmjs.org/package/nuxt-alias-path">
      <img
        src="https://img.shields.io/npm/v/nuxt-alias-path.svg"
        alt="npm version"
      >
    </a><img src="https://img.shields.io/badge/os-linux%20%7C%C2%A0macos%20%7C%C2%A0windows-blue" alt="Linux macOS Windows compatible"><a href="https://github.com/dword-design/nuxt-alias-path/actions">
      <img
        src="https://github.com/dword-design/nuxt-alias-path/workflows/build/badge.svg"
        alt="Build status"
      >
    </a><a href="https://codecov.io/gh/dword-design/nuxt-alias-path">
      <img
        src="https://codecov.io/gh/dword-design/nuxt-alias-path/branch/master/graph/badge.svg"
        alt="Coverage status"
      >
    </a><a href="https://david-dm.org/dword-design/nuxt-alias-path">
      <img src="https://img.shields.io/david/dword-design/nuxt-alias-path" alt="Dependency status">
    </a><img src="https://img.shields.io/badge/renovate-enabled-brightgreen" alt="Renovate enabled"><br/><a href="https://gitpod.io/#https://github.com/dword-design/nuxt-alias-path">
      <img
        src="https://gitpod.io/button/open-in-gitpod.svg"
        alt="Open in Gitpod"
        width="114"
      >
    </a><a href="https://www.buymeacoffee.com/dword">
      <img
        src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg"
        alt="Buy Me a Coffee"
        width="114"
      >
    </a><a href="https://paypal.me/SebastianLandwehr">
      <img
        src="https://sebastianlandwehr.com/images/paypal.svg"
        alt="PayPal"
        width="163"
      >
    </a><a href="https://www.patreon.com/dworddesign">
      <img
        src="https://sebastianlandwehr.com/images/patreon.svg"
        alt="Patreon"
        width="163"
      >
    </a>
</p>
<!-- /BADGES -->

<!-- DESCRIPTION/ -->
Cross-platform builds a path for nuxt.options.alias in modules. Passing a path straight away causes issues on Windows.
<!-- /DESCRIPTION -->

When you just write `nuxt.options.alias['#foo'] = path` in your Nuxt module, the dev server will not work on Windows. This module is a helper that fixes the issue and will hopefully eventually be fixed in Nuxt.

See here some modules also having the issue:

- https://github.com/dword-design/nuxt-mail/issues/143
- https://github.com/nuxt-modules/robots/issues/86
- https://github.com/nuxt/nuxt/issues/15500

<!-- INSTALL/ -->
## Install

```bash
# npm
$ npm install nuxt-alias-path

# Yarn
$ yarn add nuxt-alias-path
```
<!-- /INSTALL -->

## Usage

```js
import nuxtAliasPath from 'nuxt-alias-path'
import { addTemplate } from '@nuxt/kit'

export default defineNuxtModule((options, nuxt) => {
  addTemplate({
    filename: 'mod.mjs',
    getContents: () => "export default { foo: 'bar' }",
    write: true,
  })
  nuxt.options.alias['#mod'] = nuxtAliasPath('mod.mjs', JSON.stringify(options))
})
```

Then use the alias somewhere else:

```js
import foo from '#mod'
```

<!-- LICENSE/ -->
## Contribute

Are you missing something or want to contribute? Feel free to file an [issue](https://github.com/dword-design/nuxt-alias-path/issues) or a [pull request](https://github.com/dword-design/nuxt-alias-path/pulls)! ⚙️

## Support

Hey, I am Sebastian Landwehr, a freelance web developer, and I love developing web apps and open source packages. If you want to support me so that I can keep packages up to date and build more helpful tools, you can donate here:

<p>
  <a href="https://www.buymeacoffee.com/dword">
    <img
      src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg"
      alt="Buy Me a Coffee"
      width="114"
    >
  </a>&nbsp;If you want to send me a one time donation. The coffee is pretty good 😊.<br/>
  <a href="https://paypal.me/SebastianLandwehr">
    <img
      src="https://sebastianlandwehr.com/images/paypal.svg"
      alt="PayPal"
      width="163"
    >
  </a>&nbsp;Also for one time donations if you like PayPal.<br/>
  <a href="https://www.patreon.com/dworddesign">
    <img
      src="https://sebastianlandwehr.com/images/patreon.svg"
      alt="Patreon"
      width="163"
    >
  </a>&nbsp;Here you can support me regularly, which is great so I can steadily work on projects.
</p>

Thanks a lot for your support! ❤️

## License

[MIT License](https://opensource.org/licenses/MIT) © [Sebastian Landwehr](https://sebastianlandwehr.com)
<!-- /LICENSE -->
