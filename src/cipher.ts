// See https://github.com/pytube/pytube/blob/master/pytube/cipher.py

import { findObjectFromStartpoint, throttlingArraySplit } from './parser';

/**
 * This module contains all logic necessary to decipher the signature.
 *
 * YouTube's strategy to restrict downloading videos is to send a ciphered version
 * of the signature to the client, along with the decryption algorithm obfuscated
 * in JavaScript. For the clients to play the videos, JavaScript must take the
 * ciphered version, cycle it through a series of "transform functions," and then
 * signs the media URL with the output.
 *
 * This module is responsible for (1) finding and extracting those "transform
 * functions" (2) maps them to TypeScript equivalents and (3) taking the ciphered
 * signature and decoding it.
 */

// import { cache, regex_search } from "pytube.helpers";
// import {
//   findObjectFromStartpoint,
//   throttlingArray_split,
// } from "pytube.parser";

export class Cipher {
  transformPlan: string[];
  transformMap: { [key: string]: (arr: any[], arg: number) => any[] };
  jsFuncPatterns: string[];
  throttlingPlan: [number, number, number?][];
  throttlingArray: any[];
  calculatedN: string | null;

  constructor(js: string) {
    this.transformPlan = getTransformPlan(js);
    const var_regex = /^\w+\W/;
    const var_match = this.transformPlan[0].match(var_regex);
    if (!var_match) {
      throw new Error('No matches in Cipher');
    }
    const variable = var_match[0].slice(0, -1);
    this.transformMap = getTransformMap(js, variable);
    this.jsFuncPatterns = [
      '\\w+\\.(\\w+)\\(\\w,(\\d+)\\)',
      '\\w+\\[\\"\\w+\\"\\]\\(\\w,(\\d+)\\)',
    ];

    this.throttlingPlan = getThrottlingPlan(js);
    this.throttlingArray = getThrottlingFunctionArray(js);

    this.calculatedN = null;
  }

  /**
   * Converts n to the correct value to prevent throttling.
   * @param initialN
   * @returns
   */
  calculateN(initialN: string[]): string {
    if (this.calculatedN) {
      return this.calculatedN;
    }

    // First, update all instances of 'b' with the list(initialN)
    for (let i = 0; i < this.throttlingArray.length; i++) {
      if (this.throttlingArray[i] === 'b') {
        this.throttlingArray[i] = initialN;
      }
    }

    for (const step of this.throttlingPlan) {
      const curr_func = this.throttlingArray[step[0]];
      if (typeof curr_func !== 'function') {
        console.debug(`${curr_func} is not callable.`);
        console.debug(`Throttling array:\n${this.throttlingArray}\n`);
        throw new Error(`${curr_func} is not callable.`);
      }

      const first_arg = this.throttlingArray[step[1]];

      if (step.length === 2) {
        curr_func(first_arg);
      } else if (step.length === 3) {
        const second_arg = this.throttlingArray[step[2]!];
        curr_func(first_arg, second_arg);
      }
    }

    this.calculatedN = initialN.join('');
    return this.calculatedN;
  }

  /**
   * Decipher the signature.
   * Taking the ciphered signature, applies the transform functions.
   * @param cipheredSignature
   * @returns Decrypted signature required to download the media content.
   */
  getSignature(cipheredSignature: string): string {
    let signature = cipheredSignature.split('');

    for (const jsFunc of this.transformPlan) {
      const [name, argument] = this.parseFunction(jsFunc);
      signature = this.transformMap[name](signature, argument);
      console.debug(
        `applied transform function\n` +
          `output: ${signature.join('')}\n` +
          `jsFunction: ${name}\n` +
          `argument: ${argument}\n` +
          `function: ${this.transformMap[name]}`,
      );
    }

    return signature.join('');
  }

  /**
   * Parse the Javascript transform function.
   * Break a JavaScript transform function down into a two element ``tuple``
   * ontaining the function name and some integer-based argument.
   *   :param str jsFunc:
   *   :rtype: tuple
   *   :returns:
   * **Example**:
   *   parseFunction('DE.AJ(a,15)')
   *   ('AJ', 15)
   * @param jsFunc
   * @returns two element tuple containing the function name and an argument.
   */
  parseFunction(jsFunc: string): [string, number] {
    console.debug('parsing transform function');
    for (const pattern of this.jsFuncPatterns) {
      const regex = new RegExp(pattern);
      const parseMatch = jsFunc.match(regex);
      if (parseMatch) {
        const fn_name = parseMatch[0];
        const fn_arg = parseMatch[1];
        return [fn_name, parseInt(fn_arg)];
      }
    }

    throw new Error('parseFunction: jsFuncPatterns');
  }
}

function get_initial_function_name(js: string): string {
  const functionPatterns = [
    '\\b[cs]\\s*&&\\s*[adf]\\.set\\([^,]+\\s*,\\s*encodeURIComponent\\s*\\(\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\b[a-zA-Z0-9]+\\s*&&\\s*[a-zA-Z0-9]+\\.set\\([^,]+\\s*,\\s*encodeURIComponent\\s*\\(\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '(?:\\b|[^a-zA-Z0-9$])(?P<sig>[a-zA-Z0-9$]{2})\\s*=\\s*function\\(\\s*a\\s*\\)\\s*{\\s*a\\s*=\\s*a\\.split\\(\\s*""\\s*\\)',
    '(?P<sig>[a-zA-Z0-9$]+)\\s*=\\s*function\\(\\s*a\\s*\\)\\s*{\\s*a\\s*=\\s*a\\.split\\(\\s*""\\s*\\)',
    '(["\'])signature\\1\\s*,\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\.sig\\|\\|(?P<sig>[a-zA-Z0-9$]+)\\(',
    'yt\\.akamaized\\.net/\\)\\s*\\|\\|\\s*.*?\\s*[cs]\\s*&&\\s*[adf]\\.set\\([^,]+\\s*,\\s*(?:encodeURIComponent\\s*\\()?\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\b[cs]\\s*&&\\s*[adf]\\.set\\([^,]+\\s*,\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\b[a-zA-Z0-9]+\\s*&&\\s*[a-zA-Z0-9]+\\.set\\([^,]+\\s*,\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\bc\\s*&&\\s*a\\.set\\([^,]+\\s*,\\s*\\([^)]*\\)\\s*\\(\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\bc\\s*&&\\s*[a-zA-Z0-9]+\\.set\\([^,]+\\s*,\\s*\\([^)]*\\)\\s*\\(\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
    '\\bc\\s*&&\\s*[a-zA-Z0-9]+\\.set\\([^,]+\\s*,\\s*\\([^)]*\\)\\s*\\(\\s*(?P<sig>[a-zA-Z0-9$]+)\\(',
  ];
  console.debug('finding initial function name');
  for (const pattern of functionPatterns) {
    const regex = new RegExp(pattern);
    const functionMatch = js.match(regex);
    if (functionMatch) {
      console.debug(`finished regex search, matched: ${pattern}`);
      return functionMatch.groups?.['sig'] || '';
    }
  }

  throw new Error('get_initial_function_name - multiple');
}

function getTransformPlan(js: string): string[] {
  const name = escapeRegExp(get_initial_function_name(js));
  const pattern = `${name}=function\\(\\w\\){[a-z=\\.\\(\\"\\)]*;(.*);(?:.+)}`;
  console.debug('getting transform plan');
  const regex = new RegExp(pattern);
  return js.match(regex)?.[1].split(';') || [];
}

function getTransformObject(js: string, variable: string): string[] {
  const pattern = `var ${escapeRegExp(variable)}={(.*?)};`;
  console.debug('getting transform object');
  const regex = new RegExp(pattern, 's');
  const transform_match = js.match(regex);
  if (!transform_match) {
    throw new Error('getTransformObject ' + pattern);
  }

  return transform_match[1].replace('\n', ' ').split(', ');
}

function getTransformMap(
  js: string,
  variable: string,
): { [key: string]: (arr: any[], arg: number) => any[] } {
  const transform_object = getTransformObject(js, variable);
  const mapper: { [key: string]: (arr: any[], arg: number) => any[] } = {};
  for (const obj of transform_object) {
    const [name, function_body] = obj.split(':', 2);
    const fn = map_functions(function_body);
    mapper[name] = fn;
  }
  return mapper;
}

function get_throttling_function_name(js: string): string {
  const functionPatterns = [
    'a\\.[a-zA-Z]\\s*&&\\s*\\([a-z]\\s*=\\s*a\\.get\\("n"\\)\\)\\s*&&\\s*\\([a-z]\\s*=\\s*([a-zA-Z0-9$]+)(\\[\\d+\\])?\\([a-z]\\)',
  ];
  console.debug('Finding throttling function name');
  for (const pattern of functionPatterns) {
    const regex = new RegExp(pattern);
    const functionMatch = js.match(regex);
    if (functionMatch) {
      console.debug(`finished regex search, matched: ${pattern}`);
      if (Object.keys(functionMatch.groups || {}).length === 1) {
        return functionMatch.groups?.[0] || '';
      }
      const idx = functionMatch.groups?.[1] || '';
      if (idx) {
        const index = parseInt(idx.replace('[', '').replace(']', ''));
        const arrayRegex = new RegExp(
          `var ${escapeRegExp(functionMatch.groups?.[0] || '')}\\s*=\\s*(\\[.+?\\]);`,
        );
        const arrayMatch = js.match(arrayRegex);
        if (arrayMatch) {
          const array = arrayMatch.groups?.[0]
            .replace('[', '')
            .replace(']', '')
            .split(',');
          return array?.[index] || '';
        }
      }
    }
  }

  throw new Error('get_throttling_function_name multiple');
}

function getThrottlingFunctionCode(js: string): string {
  const name = escapeRegExp(get_throttling_function_name(js));
  const pattern_start = `${name}=function\\(\\w\\)`;
  const regex = new RegExp(pattern_start);
  const match = js.match(regex);
  const codeLinesList = findObjectFromStartpoint(
    js,
    match && match.index ? match?.index + match[0].length : 0,
  ).split('\n');
  const joined_lines = codeLinesList.join('');
  return match?.[0] + joined_lines;
}

function getThrottlingFunctionArray(js: string): any[] {
  const rawCode = getThrottlingFunctionCode(js);
  const arrayStart = `,c=\\[`;
  const arrayRegex = new RegExp(arrayStart);
  const match = rawCode.match(arrayRegex);
  const arrayRaw = findObjectFromStartpoint(
    rawCode,
    match && match.index ? match.index + match?.[1].length - 1 : 0,
  );
  const str_array = throttlingArraySplit(arrayRaw);

  const convertedArray: any[] = [];
  for (const el of str_array) {
    if (el === 'null') {
      convertedArray.push(null);
    } else if (/^-?\\d+$/.test(el)) {
      convertedArray.push(parseInt(el));
    } else if (el.startsWith('"') && el.endsWith('"')) {
      convertedArray.push(el.slice(1, -1));
    } else if (el.startsWith('function')) {
      const mapper: [string, Function][] = [
        [
          '{for\\(\\w=\\(\\w%\\w\\.length\\+\\w\\.length\\)%\\w\\.length;\\w--;\\)\\w\\.unshift\\(\\w.pop\\(\\)\\)}',
          throttling_unshift,
        ],
        ['{\\w\\.reverse\\(\\)}', throttling_reverse],
        ['{\\w\\.push\\(\\w\\)}', throttling_push],
        [
          ';var\\s\\w=\\w\\[0\\];\\w\\[0\\]=\\w\\[\\w\\];\\w\\[\\w\\]=\\w}',
          throttling_swap,
        ],
        ['case\\s\\d+', throttling_cipher_function],
        [
          '\\w\\.splice\\(0,1,\\w\\.splice\\(\\w,1,\\w\\[0\\]\\)\\[0\\]\\)',
          throttling_nested_splice,
        ],
        [';\\w\\.splice\\(\\w,1\\)}', js_splice],
        [
          '\\w\\.splice\\(-\\w\\)\\.reverse\\(\\)\\.forEach\\(function\\(\\w\\){\\w\\.unshift\\(\\w\\)}\\)',
          throttling_prepend,
        ],
        [
          'for\\(var \\w=\\w\\.length;\\w;\\)\\w\\.push\\(\\w\\.splice\\(--\\w,1\\)\\[0\\]\\)}',
          throttling_reverse,
        ],
      ];

      let found = false;
      for (const [pattern, fn] of mapper) {
        const regex = new RegExp(pattern);
        if (el.match(regex)) {
          convertedArray.push(fn);
          found = true;
          break;
        }
      }

      if (!found) {
        convertedArray.push(el);
      }
    } else {
      convertedArray.push(el);
    }
  }

  for (let i = 0; i < convertedArray.length; i++) {
    if (convertedArray[i] === null) {
      convertedArray[i] = convertedArray;
    }
  }

  return convertedArray;
}

function getThrottlingPlan(js: string): [number, number, number?][] {
  const rawCode = getThrottlingFunctionCode(js);
  const transformStart = `try{`;
  const planRegex = new RegExp(transformStart);
  const match = rawCode.match(planRegex);
  const transformPlan_raw = findObjectFromStartpoint(
    rawCode,
    match?.index ? match.index + match[1].length - 1 : 0,
  );
  const step_start = `c\\[(\\d+)\\]\\(c\\[(\\d+)\\](,c(\\[(\\d+)\\]))?\\)`;
  const step_regex = new RegExp(step_start, 'g');
  const matches = transformPlan_raw.match(step_regex) || [];

  const transform_steps: [number, number, number?][] = [];
  for (const match of matches) {
    if (match[4] !== '') {
      transform_steps.push([
        parseInt(match[0]),
        parseInt(match[1]),
        parseInt(match[4]),
      ]);
    } else {
      transform_steps.push([parseInt(match[0]), parseInt(match[1])]);
    }
  }

  return transform_steps;
}

function reverse(arr: any[], _: any): any[] {
  return arr.reverse();
}

function splice(arr: any[], b: number): any[] {
  return arr.slice(b);
}

function swap(arr: any[], b: number): any[] {
  const r = b % arr.length;
  return [arr[r], ...arr.slice(1, r), arr[0], ...arr.slice(r + 1)];
}

function throttling_reverse(arr: any[]): void {
  const reverse_copy = [...arr].reverse();
  for (let i = 0; i < reverse_copy.length; i++) {
    arr[i] = reverse_copy[i];
  }
}

function throttling_push(d: any[], e: any): void {
  d.push(e);
}

function throttling_mod_func(d: any[], e: number): number {
  return ((e % d.length) + d.length) % d.length;
}

function throttling_unshift(d: any[], e: number): void {
  e = throttling_mod_func(d, e);
  const new_arr = [...d.slice(-e), ...d.slice(0, -e)];
  d.length = 0;
  for (const el of new_arr) {
    d.push(el);
  }
}

function throttling_cipher_function(d: any[], e: string): void {
  const h =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split(
      '',
    );
  let f = 96;
  const this_arr = e.split('');

  const copied_list = [...d];
  for (let m = 0; m < copied_list.length; m++) {
    const l = copied_list[m];
    const bracket_val =
      (h.indexOf(l) - h.indexOf(this_arr[m]) + m - 32 + f) % h.length;
    this_arr.push(h[bracket_val]);
    d[m] = h[bracket_val];
    f--;
  }
}

function throttling_nested_splice(d: any[], e: number): void {
  e = throttling_mod_func(d, e);
  const inner_splice = js_splice(d, e, 1, d[0]);
  js_splice(d, 0, 1, inner_splice[0]);
}

function throttling_prepend(d: any[], e: number): void {
  const start_len = d.length;
  e = throttling_mod_func(d, e);
  const new_arr = [...d.slice(-e), ...d.slice(0, -e)];
  d.length = 0;
  for (const el of new_arr) {
    d.push(el);
  }
  const end_len = d.length;
  if (start_len !== end_len) {
    throw new Error('Lengths do not match after throttling prepend.');
  }
}

function throttling_swap(d: any[], e: number): void {
  e = throttling_mod_func(d, e);
  const f = d[0];
  d[0] = d[e];
  d[e] = f;
}

function js_splice(
  arr: any[],
  start: number,
  delete_count: number | null = null,
  ...items: any[]
): any[] {
  if (start > arr.length) {
    start = arr.length;
  }
  if (start < 0) {
    start = arr.length - start;
  }
  if (delete_count === null || delete_count >= arr.length - start) {
    delete_count = arr.length - start;
  }

  const deleted_elements = arr.slice(start, start + delete_count);
  const new_arr = [
    ...arr.slice(0, start),
    ...items,
    ...arr.slice(start + delete_count),
  ];
  arr.length = 0;
  for (const el of new_arr) {
    arr.push(el);
  }
  return deleted_elements;
}

function map_functions(jsFunc: string): (arr: any[], arg: number) => any[] {
  const mapper: [string, (arr: any[], arg: number) => any[]][] = [
    ['{\\w\\.reverse\\(\\)}', reverse],
    ['{\\w\\.splice\\(0,\\w\\)}', splice],
    [
      '{var\\s\\w=\\w\\[0\\];\\w\\[0\\]=\\w\\[\\w\\%\\w.length\\];\\w\\[\\w\\]=\\w}',
      swap,
    ],
    [
      '{var\\s\\w=\\w\\[0\\];\\w\\[0\\]=\\w\\[\\w\\%\\w.length\\];\\w\\[\\w\\%\\w.length\\]=\\w}',
      swap,
    ],
  ];

  for (const [pattern, fn] of mapper) {
    const regex = new RegExp(pattern);
    if (jsFunc.match(regex)) {
      return fn;
    }
  }
  throw new Error('map_functions multiple');
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
