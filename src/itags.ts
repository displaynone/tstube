type FormatProfile = {
  resolution: string | null;
  abr: string | null;
  is_live: boolean;
  is_3d: boolean;
  is_hdr: boolean;
  is_dash: boolean;
};

const PROGRESSIVE_VIDEO: Record<number, [string, string | null]> = {
  5: ['240p', '64kbps'],
  6: ['270p', '64kbps'],
  13: ['144p', null],
  17: ['144p', '24kbps'],
  18: ['360p', '96kbps'],
  22: ['720p', '192kbps'],
  34: ['360p', '128kbps'],
  35: ['480p', '128kbps'],
  36: ['240p', null],
  37: ['1080p', '192kbps'],
  38: ['3072p', '192kbps'],
  43: ['360p', '128kbps'],
  44: ['480p', '128kbps'],
  45: ['720p', '192kbps'],
  46: ['1080p', '192kbps'],
  59: ['480p', '128kbps'],
  78: ['480p', '128kbps'],
  82: ['360p', '128kbps'],
  83: ['480p', '128kbps'],
  84: ['720p', '192kbps'],
  85: ['1080p', '192kbps'],
  91: ['144p', '48kbps'],
  92: ['240p', '48kbps'],
  93: ['360p', '128kbps'],
  94: ['480p', '128kbps'],
  95: ['720p', '256kbps'],
  96: ['1080p', '256kbps'],
  100: ['360p', '128kbps'],
  101: ['480p', '192kbps'],
  102: ['720p', '192kbps'],
  132: ['240p', '48kbps'],
  151: ['720p', '24kbps'],
  300: ['720p', '128kbps'],
  301: ['1080p', '128kbps'],
};

const DASH_VIDEO: Record<number, [string, string | null]> = {
  133: ['240p', null], // MP4
  134: ['360p', null], // MP4
  135: ['480p', null], // MP4
  136: ['720p', null], // MP4
  137: ['1080p', null], // MP4
  138: ['2160p', null], // MP4
  160: ['144p', null], // MP4
  167: ['360p', null], // WEBM
  168: ['480p', null], // WEBM
  169: ['720p', null], // WEBM
  170: ['1080p', null], // WEBM
  212: ['480p', null], // MP4
  218: ['480p', null], // WEBM
  219: ['480p', null], // WEBM
  242: ['240p', null], // WEBM
  243: ['360p', null], // WEBM
  244: ['480p', null], // WEBM
  245: ['480p', null], // WEBM
  246: ['480p', null], // WEBM
  247: ['720p', null], // WEBM
  248: ['1080p', null], // WEBM
  264: ['1440p', null], // MP4
  266: ['2160p', null], // MP4
  271: ['1440p', null], // WEBM
  272: ['4320p', null], // WEBM
  278: ['144p', null], // WEBM
  298: ['720p', null], // MP4
  299: ['1080p', null], // MP4
  302: ['720p', null], // WEBM
  303: ['1080p', null], // WEBM
  308: ['1440p', null], // WEBM
  313: ['2160p', null], // WEBM
  315: ['2160p', null], // WEBM
  330: ['144p', null], // WEBM
  331: ['240p', null], // WEBM
  332: ['360p', null], // WEBM
  333: ['480p', null], // WEBM
  334: ['720p', null], // WEBM
  335: ['1080p', null], // WEBM
  336: ['1440p', null], // WEBM
  337: ['2160p', null], // WEBM
  394: ['144p', null], // MP4
  395: ['240p', null], // MP4
  396: ['360p', null], // MP4
  397: ['480p', null], // MP4
  398: ['720p', null], // MP4
  399: ['1080p', null], // MP4
  400: ['1440p', null], // MP4
  401: ['2160p', null], // MP4
  402: ['4320p', null], // MP4
  571: ['4320p', null], // MP4
  694: ['144p', null], // MP4
  695: ['240p', null], // MP4
  696: ['360p', null], // MP4
  697: ['480p', null], // MP4
  698: ['720p', null], // MP4
  699: ['1080p', null], // MP4
  700: ['1440p', null], // MP4
  701: ['2160p', null], // MP4
  702: ['4320p', null], // MP4
};

const DASH_AUDIO: Record<number, [null, string | null]> = {
  139: [null, '48kbps'], // MP4
  140: [null, '128kbps'], // MP4
  141: [null, '256kbps'], // MP4
  171: [null, '128kbps'], // WEBM
  172: [null, '256kbps'], // WEBM
  249: [null, '50kbps'], // WEBM
  250: [null, '70kbps'], // WEBM
  251: [null, '160kbps'], // WEBM
  256: [null, '192kbps'], // MP4
  258: [null, '384kbps'], // MP4
  325: [null, null], // MP4
  328: [null, null], // MP4
};

const ITAGS: Record<number, [string | null, string | null]> = {
  ...PROGRESSIVE_VIDEO,
  ...DASH_VIDEO,
  ...DASH_AUDIO,
};

const HDR: number[] = [330, 331, 332, 333, 334, 335, 336, 337];
const _3D: number[] = [82, 83, 84, 85, 100, 101, 102];
const LIVE: number[] = [91, 92, 93, 94, 95, 96, 132, 151];

export function getFormatProfile(itag: number): FormatProfile {
  itag = Number(itag);
  let res: string | null = null;
  let bitrate: string | null = null;

  if (itag in ITAGS) {
    [res, bitrate] = ITAGS[itag];
  }

  return {
    resolution: res,
    abr: bitrate,
    is_live: LIVE.includes(itag),
    is_3d: _3D.includes(itag),
    is_hdr: HDR.includes(itag),
    is_dash: itag in DASH_AUDIO || itag in DASH_VIDEO,
  };
}
