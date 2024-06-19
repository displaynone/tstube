/**
 * This module contains all non-cipher related data extraction logic.
 */
// import * as logging from 'logging';
// import { Any, Dict, List, Optional, Tuple } from 'typescript';
// import * as urllib from 'urllib';
// import * as re from 're';
// import { OrderedDict } from 'collections';
// import { datetime } from 'datetime';
// import { parse_qs, quote, urlencode, urlparse } from 'urllib.parse';

// import { Cipher } from 'pytube.cipher';
// import { HTMLParseError, LiveStreamError, RegexMatchError } from 'pytube.exceptions';
// import { regex_search } from 'pytube.helpers';
// import { YouTubeMetadata } from 'pytube.metadata';
// import { parseForObject, parseForAllObjects } from 'pytube.parser';

// const logger = logging.getLogger(__name__);
import { URL, URLSearchParams } from 'react-native-url-polyfill';
import { IStreamingData } from 'youtubei.js/agnostic';
import { Cipher } from './cipher';
import { YouTubeMetadata } from './metadata';
import { parseForAllObjects, parseForObject } from './parser';
import { MetadataRowContainerRenderer } from './types/data';
import { Format } from 'youtubei.js/dist/src/parser/misc';

function getPublishDate(watchHtml: string): Date | null {
  try {
    const result = watchHtml.match(
      /(?<=itemprop="datePublished" content=")\d{4}-\d{2}-\d{2}/,
    );
    if (!result || result?.length < 4) return null;
    return new Date(+result[1], +result[2] - 1, +result[3]);
  } catch (error) {
    if (error instanceof Error) {
      return null;
    }
    throw error;
  }
}

function isRecordingAvailable(watchHtml: string): boolean {
  return !watchHtml.includes('This live stream recording is not available.');
}

function isPrivate(watchHtml: string): boolean {
  const private_strings = [
    'This is a private video. Please sign in to verify that you may see it.',
    '"simpleText":"Private video"',
    'This video is private.',
  ];
  for (const string of private_strings) {
    if (watchHtml.includes(string)) {
      return true;
    }
  }
  return false;
}

function isAgeRestricted(watchHtml: string): boolean {
  return !!watchHtml.match(/og:restrictions:age/);
}

function playabilityStatus(watchHtml: string): [string, string[]] {
  const playerResponse = initialPlayerResponse(watchHtml);
  const statuses = playerResponse['playabilityStatus'] || {};
  if ('liveStreamability' in statuses) {
    return ['LIVE_STREAM', ['Video is a live stream.']];
  }
  if ('status' in statuses) {
    if ('reason' in statuses) {
      return [statuses['status'], [statuses['reason']]];
    }
    if ('messages' in statuses) {
      return [statuses['status'], statuses['messages']];
    }
  }
  return ['', []];
}

function getVideoId(url: string): string {
  return url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)?.[1] || '';
}

function getPlaylistId(urlString: string): string | null {
  const url = new URL(urlString);
  const params = new URLSearchParams(url.searchParams);
  return params.get('list');
}

function getChannelName(url: string): string {
  const patterns = [
    /(?:\/(c)\/([%\d\w_\-]+)(\/.*)?)/,
    /(?:\/(channel)\/([%\w\d_\-]+)(\/.*)?)/,
    /(?:\/(u)\/([%\d\w_\-]+)(\/.*)?)/,
    /(?:\/(user)\/([%\w\d_\-]+)(\/.*)?)/,
  ];
  for (const pattern of patterns) {
    const regex = new RegExp(pattern);
    const functionMatch = regex.exec(url);
    if (functionMatch) {
      console.debug('finished regex search, matched: %s', pattern);
      const uriStyle = functionMatch[1];
      const uriIdentifier = functionMatch[2];
      return `/${uriStyle}/${uriIdentifier}`;
    }
  }
  throw new Error('getChannelName - patterns');
}

function getVideoInfoUrl(videoId: string, watchUrl: string): string {
  const params = [
    ['videoId', videoId],
    ['ps', 'default'],
    ['eurl', encodeURI(watchUrl)],
    ['hl', 'en_US'],
    ['html5', '1'],
    ['c', 'TVHTML5'],
    ['cver', '7.20201028'],
  ];
  return getYoutubeVideoIInfoUrl(params);
}

function getVideoInfoUrlAgeRestricted(
  videoId: string,
  embedHtml: string,
): string {
  const sts = embedHtml.match(/"sts"\s*:\s*(\d+)/)?.[1] || '';

  const eurl = `https://youtube.googleapis.com/v/${videoId}`;
  const params = [
    ['videoId', videoId],
    ['eurl', eurl],
    ['sts', sts],
    ['html5', '1'],
    ['c', 'TVHTML5'],
    ['cver', '7.20201028'],
  ];
  return getYoutubeVideoIInfoUrl(params);
}

function getYoutubeVideoIInfoUrl(params: string[][]): string {
  return (
    'https://www.youtube.com/get_video_info?' +
    params.map(item => item.join('=')).join('&')
  );
}

function getJsUrl(html: string): string {
  const base_js = embedHtml(html)['assets']['js'];
  return 'https://youtube.com' + base_js;
}

function mimeTypeCoded(mimeTypeCoded: string): [string, string[]] {
  const pattern = /(\w+\/\w+)\;\scodecs=\"([a-zA-Z-0-9.,\s]*)\"/;
  const regex = new RegExp(pattern);
  const results = regex.exec(mimeTypeCoded);
  if (!results) {
    throw new Error('mimeTypeCoded ' + pattern.toString());
  }
  const [mime_type, codecs] = results.slice(1, 3);
  return [mime_type, codecs.split(',').map(c => c.trim())];
}

function getYtplayerJs(html: string): string {
  const jSUrlPatterns = [/\/s\/player\/[\w\d]+\/[\w\d_/.]+\/base\.js/];
  for (const pattern of jSUrlPatterns) {
    const regex = new RegExp(pattern);
    const functionMatch = regex.exec(html);
    if (functionMatch) {
      console.debug('finished regex search, matched: %s', pattern);
      return functionMatch[1];
    }
  }
  throw new Error('getYtplayerJs ' + jSUrlPatterns.toString());
}

function embedHtml(html: string): any {
  const config_patterns = [
    /ytplayer\.config\s*=\s*/,
    /ytInitialPlayerResponse\s*=\s*/,
  ];
  for (const pattern of config_patterns) {
    try {
      return parseForObject(html, pattern);
    } catch (error) {
      continue;
    }
  }
  const setconfig_patterns = [/yt\.setConfig\(.*['"]PLAYER_CONFIG['"]:\s*/];
  for (const pattern of setconfig_patterns) {
    try {
      return parseForObject(html, pattern);
    } catch (error) {
      continue;
    }
  }
  throw new Error('embedHtml config_patterns, setconfig_patterns');
}

function getYtcfg(html: string): any {
  const ytcfg = {};
  const ytcfgPatterns = [/ytcfg\s=\s/, /ytcfg\.set\(/];
  for (const pattern of ytcfgPatterns) {
    try {
      const found_objects = parseForAllObjects(html, pattern);
      for (const obj of found_objects) {
        Object.assign(ytcfg, obj);
      }
    } catch (error) {
      continue;
    }
  }
  if (Object.keys(ytcfg).length > 0) {
    return ytcfg;
  }
  throw new Error('getYtcfg' + ytcfgPatterns.toString());
}

function applySignature(streamManifest: Format[], js: string): void {
  const cipher = new Cipher(js);
  for (const stream of streamManifest) {
    const url = stream['url'];
    if (
      url &&
      (url.includes('signature') ||
        (!stream['signature_cipher'] &&
          (url.includes('&sig=') || url.includes('&lsig='))))
    ) {
      console.debug('signature found, skip decipher');
      continue;
    }
    if (!url) {
      console.error('No stream url or s');
      return;
    }
    const urlParsed = new URL(url);
    const queryParams = new URLSearchParams(urlParsed.searchParams);
    const signature = cipher.getSignature(queryParams.get('s') || '');
    console.debug(
      'finished descrambling signature for itag=%s',
      stream['itag'],
    );

    queryParams.set('sig', signature);
    if (!queryParams.has('ratebypass')) {
      const initialN = queryParams.get('n')?.split('');
      if (initialN) {
        queryParams.set('n', cipher.calculateN(initialN));
      }
    }
    stream['url'] = `${urlParsed.protocol}//${urlParsed.hostname}${
      urlParsed.pathname
    }?${queryParams}`;
  }
}

function applyDescrambler(streamData?: IStreamingData) {
  if (!streamData) {
    return [];
  }
  if ('url' in streamData) {
    return [];
  }
  const formats = [];
  if ('formats' in streamData) {
    formats.push(...streamData['formats']);
  }
  if ('adaptiveFormats' in streamData) {
    formats.push(...streamData.adaptive_formats);
  }
  for (const data of formats) {
    if (!data['url']) {
      if (data.signature_cipher) {
        const cipherUrl = new URLSearchParams(data.signature_cipher);
        data.url = cipherUrl.get('url') || '';
      }
    }
  }
  console.debug('applying descrambler');
  return formats;
}

function getInitialData(watchHtml: string): any {
  const patterns = [
    /window\[['"]ytInitialData['"]]\s*=\s*/,
    /ytInitialData\s*=\s*/,
  ];
  for (const pattern of patterns) {
    try {
      return parseForObject(watchHtml, pattern);
    } catch (error) {
      continue;
    }
  }
  throw new Error('initialData' + patterns.toString());
}

function initialPlayerResponse(watchHtml: string): any {
  const patterns = [
    /window\[['"]ytInitialPlayerResponse['"]]\s*=\s*/,
    /ytInitialPlayerResponse\s*=\s*/,
  ];
  for (const pattern of patterns) {
    try {
      return parseForObject(watchHtml, pattern);
    } catch (error) {
      continue;
    }
  }
  throw new Error('initialPlayerResponse' + patterns.toString());
}

function metadata(initialData: any): YouTubeMetadata {
  let metadataRows: MetadataRowContainerRenderer['rows'];
  try {
    metadataRows =
      initialData['contents']['twoColumnWatchNextResults']['results'][
        'results'
      ]['contents'][1]['videoSecondaryInfoRenderer']['metadataRowContainer'][
        'metadataRowContainerRenderer'
      ]['rows'];
  } catch (error) {
    return new YouTubeMetadata([]);
  }
  metadataRows = metadataRows.filter((x: any) => 'metadataRowRenderer' in x);
  metadataRows = metadataRows.map((x: any) => x['metadataRowRenderer']);
  return new YouTubeMetadata(metadataRows);
}

export default {
  applyDescrambler,
  applySignature,
  embedHtml,
  getChannelName,
  getJsUrl,
  getPlaylistId,
  getPublishDate,
  getVideoId,
  getVideoInfoUrl,
  getVideoInfoUrlAgeRestricted,
  getYoutubeVideoIInfoUrl,
  getYtcfg,
  getYtplayerJs,
  getInitialData,
  initialPlayerResponse,
  isAgeRestricted,
  isPrivate,
  isRecordingAvailable,
  metadata,
  mimeTypeCoded,
  playabilityStatus,
};
