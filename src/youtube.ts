/**
 * This module implements the core developer interface for pytube.
 *
 * The problem domain of the YouTube class focuses almost
 * exclusively on the developer interface. Pytube offloads the heavy lifting to
 * smaller peripheral modules and functions.
 */

import Innertube from 'youtubei.js/agnostic';
import { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';
import extract from './extract';
import { Stream } from './stream';

// import * as logging from 'logging';
// import { Any, Callable, Dict, List, Optional } from 'typescript';
// import * as pytube from 'pytube';
// import * as exceptions from 'pytube.exceptions';
// import { extract, request } from 'pytube';
// import { Stream, StreamQuery } from 'pytube';
// import { installProxy } from 'pytube.helpers';
// import { InnerTube } from 'pytube.innertube';
// import { YouTubeMetadata } from 'pytube.metadata';
// import { Monostate } from 'pytube.monostate';

// const logger = logging.getLogger(__name__);

class YouTube {
  private watchUrl: string;
  private watchHtml: string;
  private embedHtml: string;
  private embedUrl: string;
  private videoId: string;
  private videoInfo?: VideoInfo;
  private formatStreams: Stream[] = [];

  constructor(url: string) {
    this.videoId = extract.getVideoId(url);
    this.watchUrl = `https://youtube.com/watch?v=${this.videoId}`;
    this.embedUrl = `https://www.youtube.com/embed/${this.videoId}`;
    this.watchHtml = '';
    this.embedHtml = '';
  }

  async getWatchHtml(): Promise<string> {
    if (this.watchHtml) return this.watchHtml;
    const response = await fetch(this.watchUrl);
    this.watchHtml = await response.text();
    return this.watchHtml;
  }

  async getEmbedHtml(): Promise<string> {
    if (this.embedHtml) return this.embedHtml;
    const response = await fetch(this.embedUrl);
    this.embedHtml = await response.text();
    return this.embedHtml;
  }

  isAgeRestricted(): boolean {
    return extract.isAgeRestricted(this.watchHtml);
  }

  getJsUrl(): string {
    if (this.isAgeRestricted()) {
      return extract.getJsUrl(this.embedHtml);
    } else {
      return extract.getJsUrl(this.watchHtml);
    }
  }

  async getJs(): Promise<string> {
    const response = await fetch(this.getJsUrl());
    return await response.text();
  }

  getInitialData(): any {
    return extract.getInitialData(this.watchHtml);
  }

  getStreamingData() {
    if (this.videoInfo?.streaming_data) {
      return this.videoInfo.streaming_data;
    }
    return undefined;
  }

  async getFormatStreams() {
    this.checkAvailability();

    const formats = extract.applyDescrambler(this.getStreamingData());

    try {
      extract.applySignature(formats, await this.getJs());
    } catch (error) {
      throw error;
    }

    for (const stream of formats) {
      const video = new Stream(stream, this.videoInfo);
      this.formatStreams.push(video);
    }

    return this.formatStreams;
  }

  checkAvailability() {
    const [status, messages] = extract.playabilityStatus(this.watchHtml);
    for (const reason of messages) {
      if (status === 'UNPLAYABLE') {
        if (
          reason ===
          'Join this channel to get access to members-only content like this video, and other exclusive perks.'
        ) {
          throw new Error('MembersOnly video ' + this.videoId);
        } else if (reason === 'This live stream recording is not available.') {
          throw new Error(
            'Live stream recording is not available ' + this.videoId,
          );
        } else {
          throw new Error('Video unvailable ' + this.videoId);
        }
      } else if (status === 'LOGIN_REQUIRED') {
        if (
          reason ===
          'This is a private video. Please sign in to verify that you may see it.'
        ) {
          throw new Error('Private video ' + this.videoId);
        }
      } else if (status === 'ERROR') {
        if (reason === 'Video unavailable') {
          throw new Error('Video unavailable ' + this.videoId);
        }
      } else if (status === 'LIVE_STREAM') {
        throw new Error('Live stream error ' + this.videoId);
      }
    }
  }

  async getVideoInfo() {
    const youtube = await Innertube.create({});

    this.videoInfo = await youtube.getInfo(this.videoId);
    return this.videoInfo;
  }

  get caption_tracks() {
    return this.videoInfo?.captions?.caption_tracks || [];
  }

  get streams() {
    return this.getFormatStreams();
  }

  get thumbnail_url(): string {
    const thumbnail_details = this.videoInfo?.basic_info?.thumbnail;
    if (thumbnail_details) {
      const thumbnail = thumbnail_details[thumbnail_details.length - 1];
      return thumbnail.url;
    }
    return `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
  }

  get title() {
    return this.videoInfo?.basic_info?.title;
  }

  get description() {
    return this.videoInfo?.basic_info?.short_description;
  }

  get length() {
    return this.videoInfo?.basic_info.duration;
  }

  get views() {
    return this.videoInfo?.basic_info.view_count;
  }

  get author() {
    return this.videoInfo?.basic_info.author;
  }

  get keywords() {
    return this.videoInfo?.basic_info.keywords;
  }

  get channel_id() {
    return this.videoInfo?.basic_info.channel_id;
  }

  get channel_url(): string {
    return `https://www.youtube.com/channel/${this.channel_id}`;
  }

  static from_id(videoId: string): YouTube {
    return new YouTube(`https://www.youtube.com/watch?v=${videoId}`);
  }
}

export default YouTube;
