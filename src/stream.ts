import { URL, URLSearchParams } from 'react-native-url-polyfill';
import { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';
import { getFormatProfile } from './itags';
import { Format } from 'youtubei.js/dist/src/parser/misc';

export class Stream {
  public url: string | null;
  public _title?: string;
  public itag: number;
  public mime_type: string;
  public codecs: string[];
  public type: string;
  public subtype: string;
  public video_codec?: string;
  public audio_codec?: string;
  public is_otf: boolean;
  public bitrate?: number;
  private _filesize?: number;
  private _filesize_kb?: number;
  private _filesize_mb?: number;
  private _filesize_gb?: number;
  public is_dash: boolean;
  public abr: string | null;
  public fps: number | null;
  public resolution: string | null;
  public is_3d: boolean;
  public is_hdr: boolean;
  public is_live: boolean;
  public duration: number;

  constructor(stream: Format, videoInfo?: VideoInfo) {
    this.url = stream.url || null;
    this._title = videoInfo?.basic_info.title;
    this.itag = stream.itag;
    const { mimeType, codecs } = this.extractMimeTypeCodec(stream.mime_type);
    this.mime_type = mimeType;
    this.codecs = codecs;
    [this.type, this.subtype] = this.mime_type.split('/');
    [this.video_codec, this.audio_codec] = this.parseCodecs();
    this.is_otf = !stream.is_type_otf;
    this.bitrate = stream.bitrate;
    this._filesize = stream.content_length;
    this._filesize_kb = this._filesize
      ? Math.ceil((this._filesize / 1024) * 1000) / 1000
      : undefined;
    this._filesize_mb = this._filesize
      ? Math.ceil((this._filesize / 1024 / 1024) * 1000) / 1000
      : undefined;
    this._filesize_gb = this._filesize
      ? Math.ceil((this._filesize / 1024 / 1024 / 1024) * 1000) / 1000
      : undefined;
    this.duration = +stream.approx_duration_ms;

    const itag_profile = getFormatProfile(this.itag);
    this.is_dash = itag_profile.is_dash;
    this.abr = itag_profile.abr;
    this.fps = stream.fps || null;
    this.resolution = itag_profile.resolution;
    this.is_3d = itag_profile.is_3d;
    this.is_hdr = itag_profile.is_hdr;
    this.is_live = itag_profile.is_live;
  }

  private extractMimeTypeCodec(mimeTypeCodec: string): {
    mimeType: string;
    codecs: string[];
  } {
    const [mimeType, codecString] = mimeTypeCodec.split(';');
    const codecs = codecString
      .replace('codecs=', '')
      .replace(/"/g, '')
      .split(',');
    return { mimeType, codecs };
  }

  private parseCodecs(): [string?, string?] {
    let video: string | undefined = undefined;
    let audio: string | undefined = undefined;
    if (!this.is_adaptive) {
      [video, audio] = this.codecs;
    } else if (this.includes_video_track) {
      video = this.codecs[0];
    } else if (this.includes_audio_track) {
      audio = this.codecs[0];
    }
    return [video, audio];
  }

  get is_adaptive(): boolean {
    return this.codecs.length % 2 === 1;
  }

  get is_progressive(): boolean {
    return !this.is_adaptive;
  }

  get includes_audio_track(): boolean {
    return this.is_progressive || this.type === 'audio';
  }

  get includes_video_track(): boolean {
    return this.is_progressive || this.type === 'video';
  }

  get filesize(): number {
    return this._filesize || 0;
  }

  get filesize_kb(): number {
    return this._filesize_kb || 0;
  }

  get filesize_mb(): number {
    return this._filesize_mb || 0;
  }

  get filesize_gb(): number {
    return this._filesize_gb || 0;
  }

  get title(): string {
    return this._title || 'Unknown YouTube Video Title';
  }

  get filesize_approx(): number {
    if (this.duration && this.bitrate) {
      const bitsInByte = 8;
      return Math.round((this.duration * this.bitrate) / bitsInByte);
    }
    return this.filesize;
  }

  get expiration(): Date {
    if (!this.url) return new Date();
    const parsedURL = new URL(this.url);
    const params = new URLSearchParams(parsedURL.searchParams);
    const expire = params.get('expire');
    if (!expire) return new Date();
    return new Date(+expire * 1000);
  }
}
