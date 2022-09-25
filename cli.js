import meow from 'meow'

export const cli = meow(`
  Usage
    $ schism <input>

  Options
    --version             Show the version number
    --help                Show the help message
    -o, --out [out.wasm]  Specify a file to write the wasm to
    --stage [0]           Specify which stage compiler to use
`, {
  importMeta: import.meta,
  flags: {
    out: {
      type: 'string',
      alias: 'o',
      default: 'out.wasm'
    },
    stage: {
      type: 'string',
      default: '0'
    }
  }
});
