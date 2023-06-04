# Changelog

## [0.4.5](https://github.com/hlysine/reactive/compare/v0.4.4...v0.4.5) (2023-06-03)


### Features

* allow makeReactive to be used on custom hooks ([83d414d](https://github.com/hlysine/reactive/commit/83d414d2f9b9ee852fb412a68d6fa5198bc90153))
* rework reactive core to work with strict mode intrinsically ([bf19270](https://github.com/hlysine/reactive/commit/bf19270ce7ce601cde3f31dd25ba0df979bc7a4b))


### Bug Fixes

* infinite re-render when effects trigger state change before component mounts ([a9a4fb7](https://github.com/hlysine/reactive/commit/a9a4fb76fa8751343150384551f47555ff0c7ac7))

## [0.4.4](https://github.com/hlysine/reactive/compare/v0.4.3...v0.4.4) (2023-06-01)


### Bug Fixes

* makeReactive not updating props on rerender ([623bc6f](https://github.com/hlysine/reactive/commit/623bc6f16e4fdaccc3ea4a68af7c814f66bbee4c))

## [0.4.3](https://github.com/hlysine/reactive/compare/v0.4.2...v0.4.3) (2023-05-31)


### Bug Fixes

* fix makeReactive types to accept components with props ([e78acf4](https://github.com/hlysine/reactive/commit/e78acf428b047d123419bb8d8cae227be789be53))

## [0.4.2](https://github.com/hlysine/reactive/compare/v0.4.1...v0.4.2) (2023-05-31)


### Features

* add onStop option to watch ([8ad1d99](https://github.com/hlysine/reactive/commit/8ad1d99b601b31e3da7b0d56370c0a43c127d21a))
* re-export isShallow utility ([a1aa3b5](https://github.com/hlysine/reactive/commit/a1aa3b5512ac73f07584be7d90091f2a3b4716d3))


### Bug Fixes

* change some safe navigation to null assertions ([2324272](https://github.com/hlysine/reactive/commit/23242729a0125409131a3289ad490750b6f94830))
* reject lazy option for useWatch as well ([4f14ef7](https://github.com/hlysine/reactive/commit/4f14ef7c8b9537d3f541874e750dcaa71a58acac))
* remove unreachable code branches ([30c4de1](https://github.com/hlysine/reactive/commit/30c4de127a080c329d4d048a055eb9fafc47d0af))

## [0.4.1](https://github.com/hlysine/reactive/compare/v0.4.0...v0.4.1) (2023-05-26)


### Features

* allow reactive hooks to be used outside reactive components ([aeea136](https://github.com/hlysine/reactive/commit/aeea136cdc47efa35069c22a224ef4ab70ccd327))
* show warning when certain hooks are used outside of effect scope ([32d6194](https://github.com/hlysine/reactive/commit/32d6194f3425e4563d6c33f69721b1737819b428))


### Bug Fixes

* fix effects not getting cleaned up due to strict mode double rendering ([6ed504b](https://github.com/hlysine/reactive/commit/6ed504b1410d1bf16d5f0d5a3b3fdcc348ea95ce))
* fix incorrect import ([a3975a8](https://github.com/hlysine/reactive/commit/a3975a8ff5c906f959dfa9312aa6fdc27c4eddc8))
* remove re-render message to avoid spam when in dev mode ([30275a4](https://github.com/hlysine/reactive/commit/30275a4ba59261d20dd4b6f63d5c378ab98f8028))

## [0.4.0](https://github.com/hlysine/reactive/compare/v0.3.0...v0.4.0) (2023-05-24)


### ⚠ BREAKING CHANGES

* remove "lazy" option for `useWatchEffect`

### Bug Fixes

* clean up functions not called when the component unmounts ([8ffae7f](https://github.com/hlysine/reactive/commit/8ffae7f164ab048a134022acd54a4d9918cbdf14))
* preserve user-set onStop callbacks ([3c898f3](https://github.com/hlysine/reactive/commit/3c898f3ea593c957dc8a5b639f4662ff0417b905))
* remove "lazy" option for `useWatchEffect` ([3eee2f7](https://github.com/hlysine/reactive/commit/3eee2f7fd2f9416297fd41804cd737b1725a3970))
* remove debug console log ([1b5de43](https://github.com/hlysine/reactive/commit/1b5de43f8c33d780f05c0b6b8ca641843ed99981))

## [0.3.0](https://github.com/hlysine/reactive/compare/v0.2.1...v0.3.0) (2023-05-22)


### ⚠ BREAKING CHANGES

* remove useReactiveEffect, add useWatch and useWatchEffect

### Features

* add missing exports ([e54ab60](https://github.com/hlysine/reactive/commit/e54ab604e246322a94a882c4738319bdf599cf2b))
* remove useReactiveEffect, add useWatch and useWatchEffect ([85cca77](https://github.com/hlysine/reactive/commit/85cca77d201471fb861bc30987693c4421cc7524))

## [0.2.1](https://github.com/hlysine/reactive/compare/v0.2.0...v0.2.1) (2023-05-21)


### Features

* re-export reactive functions from @vue/reactivity ([1b6dc01](https://github.com/hlysine/reactive/commit/1b6dc0194e146e4cb8a339cd3b53bfa1599e9ba1))

## [0.2.0](https://github.com/hlysine/reactive/compare/v0.1.0...v0.2.0) (2023-05-21)


### ⚠ BREAKING CHANGES

* rename package to avoid name conflict

### Code Refactoring

* rename package to avoid name conflict ([ab0c160](https://github.com/hlysine/reactive/commit/ab0c160ad92570b2d7dd729c2eb150321c94a117))

## 0.1.0 (2023-05-21)


### Features

* initial commit ([3b5b8f4](https://github.com/hlysine/reactive/commit/3b5b8f4460bcc97026e570ccea3cf60e4ece3286))
