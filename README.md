# companion-module-behringer-x32

## Getting started

Execute `yarn` command to install the dependencies.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn build:watch` the compiler will be run in watch mode to recompile the files on change.

## Changes

### v2.3.2

- Fix bad send calls causing error dialog loop

### v2.3.1

- Fix connection management

### v2.3.0

- Oscillator enable & destination

### v2.2.0

- Set level of bus send to matrix

- Mute/unmute bus send to matrix

- Set level of channel send to bus

- Talkback on/off

- Set input trim

- Set headamp gain

### v2.1.0

- Fix initial state loading

- Fix mute toggle actions not always working on first use

- Mute/unmute channel send to buses

### v2.0.0

- Rewrite in Typescript with some linting and formatting rules.

- Added Mute feedback

- Added variables for channel names and fader levels

- Use slider inputs for fader levels

- Rework channel selection to use a proper list with current names
