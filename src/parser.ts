export function parseForAllObjects(
  html: string,
  precedingRegex: RegExp,
): object[] {
  const result: any[] = [];
  const regex = new RegExp(precedingRegex);
  const matchIter = html.matchAll(regex);

  for (const match of matchIter) {
    if (match) {
      const startIndex = match.index! + match[0].length;
      const obj = parseForObjectFromStartpoint(html, startIndex);
      result.push(obj);
    }
  }

  if (result.length === 0) {
    throw new Error(`No matches for regex ${precedingRegex}`);
  }

  return result;
}

export function parseForObject(html: string, regex: RegExp): object {
  const result = regex.exec(html);
  if (!result) {
    throw new Error(`No matches for regex ${regex}`);
  }

  const startIndex = result.index! + result[0].length;
  return parseForObjectFromStartpoint(html, startIndex);
}

export function findObjectFromStartpoint(html: string, startPoint: number): string {
  html = html.substring(startPoint);
  if (!['{', '['].includes(html[0])) {
    throw new Error(
      `Invalid start point. Start of HTML:\n${html.slice(0, 20)}`,
    );
  }

  let lastChar: string = '{';
  let currChar: string | null = null;
  const stack: string[] = [html[0]];
  let i = 1;

  const contextClosers: { [key: string]: string } = {
    '{': '}',
    '[': ']',
    '"': '"',
    '/': '/', // javascript regex
  };

  while (i < html.length) {
    if (stack.length === 0) {
      break;
    }
    if (currChar && currChar !== ' ' && currChar !== '\n') {
      lastChar = currChar;
    }
    currChar = html[i];
    const currContext = stack[stack.length - 1];

    if (currChar === contextClosers[currContext]) {
      stack.pop();
      i++;
      continue;
    }

    if (currContext === '"' || currContext === '/') {
      if (currChar === '\\') {
        i += 2;
        continue;
      }
    } else {
      if (currChar in contextClosers) {
        if (
          !(
            currChar === '/' &&
            ![
              '(',
              ',',
              '=',
              ':',
              '[',
              '!',
              '&',
              '|',
              '?',
              '{',
              '}',
              ';',
            ].includes(lastChar)
          )
        ) {
          stack.push(currChar);
        }
      }
    }

    i++;
  }

  return html.slice(0, i);
}

export function parseForObjectFromStartpoint(
  html: string,
  startPoint: number,
): object {
  const fullObj = findObjectFromStartpoint(html, startPoint);
  return JSON.parse(fullObj);
}

export function throttlingArraySplit(jsArray: string): string[] {
  const results: string[] = [];
  let currSubstring = jsArray.slice(1);

  const commaRegex = new RegExp(',');
  const funcRegex = new RegExp('function\\([^)]*\\)');

  while (currSubstring.length > 0) {
    if (currSubstring.startsWith('function')) {
      const match = funcRegex.exec(currSubstring);
      const matchStart = match?.index || 0;
      const matchEnd = matchStart + (match?.[0].length || 0);

      const functionText = findObjectFromStartpoint(
        currSubstring,
        match![0].length,
      );
      const fullFunctionDef = currSubstring.slice(
        0,
        matchEnd + functionText.length,
      );
      results.push(fullFunctionDef);
      currSubstring = currSubstring.slice(fullFunctionDef.length + 1);
    } else {
      const match = commaRegex.exec(currSubstring);
      let matchStart, matchEnd;

      try {
        matchStart = match!.index;
        matchEnd = match!.index! + match![0].length;
      } catch (error) {
        matchStart = currSubstring.length - 1;
        matchEnd = matchStart + 1;
      }

      const currEl = currSubstring.slice(0, matchStart);
      results.push(currEl);
      currSubstring = currSubstring.slice(matchEnd);
    }
  }

  return results;
}
