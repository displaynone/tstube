import { MetadataElement } from "./types/data";

export class YouTubeMetadata {
  private rawMetaData: MetadataElement[];
  private metaData: Array<{ [key: string]: string }>;

  constructor(metadata: MetadataElement[]) {
      this.rawMetaData = metadata;
      this.metaData = [{}];

      for (const el of metadata) {
          if (el.title && el.title.simpleText) {
              const metadataTitle = el.title.simpleText;
              const contents = el.contents[0];

              if (contents.simpleText) {
                  this.metaData[this.metaData.length - 1][metadataTitle] = contents.simpleText;
              } else if (contents.runs) {
                  this.metaData[this.metaData.length - 1][metadataTitle] = contents.runs[0].text;
              }

              if (el.hasDividerLine) {
                  this.metaData.push({});
              }
          }
      }

      if (Object.keys(this.metaData[this.metaData.length - 1]).length === 0) {
          this.metaData.pop();
      }
  }

  get rawMetadata(): MetadataElement[] {
      return this.rawMetaData;
  }

  get metadata(): Array<{ [key: string]: string }> {
      return this.metaData;
  }

  getItem(key: number): { [key: string]: string } | undefined {
      return this.metaData[key];
  }

  [Symbol.iterator](): Iterator<{ [key: string]: string }> {
      let index = 0;
      return {
          next: (): IteratorResult<{ [key: string]: string }> => {
              if (index < this.metaData.length) {
                  return { value: this.metaData[index++], done: false };
              } else {
                  return { value: undefined, done: true };
              }
          }
      };
  }

  toString(): string {
      return JSON.stringify(this.metaData);
  }
}