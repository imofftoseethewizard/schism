#!/usr/bin/env node

//
// Copyright 2022 Pat Lasswell <imofftoseethewizard@gmail.com>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { exec } from 'child_process'
import util from 'node:util'

const asyncExec = util.promisify(exec)

import path from 'path'

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const schismRoot = path.dirname(__dirname)
const schismLib = path.join(schismRoot, 'lib')

const defaultCompilerSource = path.join(schismLib, 'compiler.ss')

const argv = yargs(hideBin(process.argv))
      .env('SCHISM')
      .usage(
`Compile scheme to WebAssembly, evaluate s-expressions, or start a REPL.\n
Usage: $0 [options] [file ...]`)
      .option(
          'b',
          {
              'alias': 'bootstrap',
              'conflicts': 'compiler-image',
              'coerce': path.resolve,
              'default': defaultCompilerSource,
              'description': 'Path to schism compiler source for Guile bootstrap. Inhibits the REPL.',
              'type': 'string',
          })
      .option(
          'I',
          {
              'alias': 'compiler-image',
              'conflicts': 'bootstrap',
              'coerce': path.resolve,
//              'default': TODO,
              'description': 'Path to compiler image, expected to be stored as a wasm binary.',
              'normalize': true,
              'type': 'string',
          })
      .option(
          'i',
          {
              'alias': 'interactive',
              'description': 'Force an interactive session despite other options.',
              'default': false,
              'type': 'boolean',
          })
      .option(
          'e',
          {
              'alias': 'evaluate',
              'array': true,
              'description': 'A form to evaluate. May be specified multiple times. Inhibits the REPL.',
              'type': 'string',
          })
      .option(
          'o',
          {
              'alias': 'output-template',
              'default': './{}.wasm',
              'description': `Template for generating the path to write each compiled
                              module. Must either contain "{}" or be "-", indicating
                              output to stdout. The stem of the source file will be
                              substituted for the "{}" when the compilation result is
                              saved.`,
              'type': 'string',
          })
      .option(
          'r',
          {
              'alias': 'runtime',
              'choices': ['node'],
              'default': 'node',
              'description': 'Type of runtime to use. Currently only "node" is supported.',
              'type': 'string',
          })
      .nargs(
          {
              'bootstrap': 1,
              'compiler-image': 1,
              'evaluate': 1,
              'interactive': 0,
              'output-template': 1,
              'runtime': 1,
          })
      .example(`To create a bootstrap image of the compiler using Guile, pass the
                -b/--bootstrap option with the path to the compiler. With no other
                arguments, this will write the compiled output to the same directory
                as the source file. Typically this is not desired and the
                -o/--output-template file is also supplied:

                >    $ schism -b ./schism/compiler.ss -o ./build/lib/{}0.wasm
          `)
      .example(`To compile a source module using a previously compiled image of the
                compiler, specify the image using the -I/--compiler-image option.
                This is often provided as an environment variable

                >    $ export SCHISM_COMPILER_IMAGE=/usr/share/lib/schism/compiler.wasm
                >    $ schism

                or

                >    $ schism -I ./build/lib/compiler0.wasm -o build/lib/{}1.wasm \\
                >          ./schism/compiler.ss

                to build a self-hosted image from the bootstrap image.
          `)
      .epilog(
`The presence of the -b/--bootstrap or -e/--evaluate options, or of one or more \
source files will inhibit the REPL. If a REPL is desired, then one can be forced with \
the -i/--interactive option.`)
      .argv

function pathStem(p) {
    return path.basename(p, path.extname(p))
}

function compilerOutputFilePath(sourcePath) {
    return argv.outputTemplate.replace('{}', pathStem(sourcePath))
}

async function bootstrapCompiler() {
    const guileBootstrapShim = path.join(schismLib, 'bootstrap-from-guile.scm')
    const compilerSource = path.join(schismLib, 'compiler.ss')
    const wasmOut = compilerOutputFilePath(compilerSource)

    const cmd = `guile-2.2 ${guileBootstrapShim} ${wasmOut} ${compilerSource}`

    console.log(cmd)
    const { stdout, stderr } = await asyncExec(cmd);

    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
}


if (argv.bootstrap) {
    await bootstrapCompiler();
} else {
    // open file
}

console.log(argv)
