export interface YoutubeResponse {
  responseContext: ResponseContext;
  playabilityStatus: PlayabilityStatus;
  streamingData: StreamingData;
  playbackTracking: PlaybackTracking;
  videoDetails: VideoDetails;
  playerConfig: PlayerConfig;
  storyboards: Storyboards;
  microformat: Microformat;
  cards: Cards;
  trackingParams: string;
  attestation: Attestation;
  adBreakHeartbeatParams: string;
  frameworkUpdates: FrameworkUpdates;
}

export interface ResponseContext {
  serviceTrackingParams: ServiceTrackingParam[];
  maxAgeSeconds: number;
  mainAppWebResponseContext: MainAppWebResponseContext;
  webResponseContextExtensionData: WebResponseContextExtensionData;
}

export interface ServiceTrackingParam {
  service: string;
  params: Param[];
}

export interface Param {
  key: string;
  value: string;
}

export interface MainAppWebResponseContext {
  loggedOut: boolean;
  trackingParam: string;
}

export interface WebResponseContextExtensionData {
  hasDecorated: boolean;
}

export interface PlayabilityStatus {
  status: string;
  playableInEmbed: boolean;
  miniplayer: Miniplayer;
  contextParams: string;
}

export interface Miniplayer {
  miniplayerRenderer: MiniplayerRenderer;
}

export interface MiniplayerRenderer {
  playbackMode: string;
}

export interface StreamingData {
  expiresInSeconds: string;
  formats: Format[];
  adaptiveFormats: AdaptiveFormat[];
  serverAbrStreamingUrl: string;
}

export interface Format {
  itag: number;
  url: string | null;
  mimeType: string;
  bitrate: number;
  width: number;
  height: number;
  lastModified: string;
  contentLength: string;
  quality: string;
  fps: number;
  qualityLabel: string;
  projectionType: string;
  averageBitrate: number;
  audioQuality: string;
  approxDurationMs: string;
  audioSampleRate: string;
  audioChannels: number;
  signatureCipher?: string;
  s: string | null;
  type?: string;
  is_otf?: boolean;
}

export interface AdaptiveFormat {
  itag: number;
  url: string | null;
  mimeType: string;
  bitrate: number;
  width: number;
  height: number;
  initRange: InitRange;
  indexRange: IndexRange;
  lastModified: string;
  contentLength: string;
  quality: string;
  fps: number;
  qualityLabel: string;
  projectionType: string;
  averageBitrate: number;
  colorInfo: ColorInfo;
  approxDurationMs: string;
  signatureCipher?: string;
  s: string | null;
  type?: string;
  is_otf?: boolean;
}

export interface InitRange {
  start: string;
  end: string;
}

export interface IndexRange {
  start: string;
  end: string;
}

export interface ColorInfo {
  primaries: string;
  transferCharacteristics: string;
  matrixCoefficients: string;
}

export interface PlaybackTracking {
  videostatsPlaybackUrl: VideostatsPlaybackUrl;
  videostatsDelayplayUrl: VideostatsDelayplayUrl;
  videostatsWatchtimeUrl: VideostatsWatchtimeUrl;
  ptrackingUrl: PtrackingUrl;
  qoeUrl: QoeUrl;
  atrUrl: AtrUrl;
  videostatsScheduledFlushWalltimeSeconds: number[];
  videostatsDefaultFlushIntervalSeconds: number;
}

export interface VideostatsPlaybackUrl {
  baseUrl: string;
}

export interface VideostatsDelayplayUrl {
  baseUrl: string;
}

export interface VideostatsWatchtimeUrl {
  baseUrl: string;
}

export interface PtrackingUrl {
  baseUrl: string;
}

export interface QoeUrl {
  baseUrl: string;
}

export interface AtrUrl {
  baseUrl: string;
  elapsedMediaTimeSeconds: number;
}

export interface VideoDetails {
  videoId: string;
  title: string;
  lengthSeconds: string;
  keywords: string[];
  channelId: string;
  isOwnerViewing: boolean;
  shortDescription: string;
  isCrawlable: boolean;
  thumbnail: Thumbnail;
  allowRatings: boolean;
  viewCount: string;
  author: string;
  isPrivate: boolean;
  isUnpluggedCorpus: boolean;
  isLiveContent: boolean;
}

export interface Thumbnail {
  thumbnails: Thumbnail2[];
}

export interface Thumbnail2 {
  url: string;
  width: number;
  height: number;
}

export interface PlayerConfig {
  audioConfig: AudioConfig;
  streamSelectionConfig: StreamSelectionConfig;
  mediaCommonConfig: MediaCommonConfig;
  webPlayerConfig: WebPlayerConfig;
}

export interface AudioConfig {
  loudnessDb: number;
  perceptualLoudnessDb: number;
  enablePerFormatLoudness: boolean;
}

export interface StreamSelectionConfig {
  maxBitrate: string;
}

export interface MediaCommonConfig {
  dynamicReadaheadConfig: DynamicReadaheadConfig;
  mediaUstreamerRequestConfig: MediaUstreamerRequestConfig;
  useServerDrivenAbr: boolean;
  serverPlaybackStartConfig: ServerPlaybackStartConfig;
}

export interface DynamicReadaheadConfig {
  maxReadAheadMediaTimeMs: number;
  minReadAheadMediaTimeMs: number;
  readAheadGrowthRateMs: number;
}

export interface MediaUstreamerRequestConfig {
  videoPlaybackUstreamerConfig: string;
}

export interface ServerPlaybackStartConfig {
  enable: boolean;
  playbackStartPolicy: PlaybackStartPolicy;
}

export interface PlaybackStartPolicy {
  startMinReadaheadPolicy: StartMinReadaheadPolicy[];
}

export interface StartMinReadaheadPolicy {
  minReadaheadMs: number;
}

export interface WebPlayerConfig {
  useCobaltTvosDash: boolean;
  webPlayerActionsPorting: WebPlayerActionsPorting;
}

export interface WebPlayerActionsPorting {
  getSharePanelCommand: GetSharePanelCommand;
  subscribeCommand: SubscribeCommand;
  unsubscribeCommand: UnsubscribeCommand;
  addToWatchLaterCommand: AddToWatchLaterCommand;
  removeFromWatchLaterCommand: RemoveFromWatchLaterCommand;
}

export interface GetSharePanelCommand {
  clickTrackingParams: string;
  commandMetadata: CommandMetadata;
  webPlayerShareEntityServiceEndpoint: WebPlayerShareEntityServiceEndpoint;
}

export interface CommandMetadata {
  webCommandMetadata: WebCommandMetadata;
}

export interface WebCommandMetadata {
  sendPost: boolean;
  apiUrl: string;
}

export interface WebPlayerShareEntityServiceEndpoint {
  serializedShareEntity: string;
}

export interface SubscribeCommand {
  clickTrackingParams: string;
  commandMetadata: CommandMetadata2;
  subscribeEndpoint: SubscribeEndpoint;
}

export interface CommandMetadata2 {
  webCommandMetadata: WebCommandMetadata2;
}

export interface WebCommandMetadata2 {
  sendPost: boolean;
  apiUrl: string;
}

export interface SubscribeEndpoint {
  channelIds: string[];
  params: string;
}

export interface UnsubscribeCommand {
  clickTrackingParams: string;
  commandMetadata: CommandMetadata3;
  unsubscribeEndpoint: UnsubscribeEndpoint;
}

export interface CommandMetadata3 {
  webCommandMetadata: WebCommandMetadata3;
}

export interface WebCommandMetadata3 {
  sendPost: boolean;
  apiUrl: string;
}

export interface UnsubscribeEndpoint {
  channelIds: string[];
  params: string;
}

export interface AddToWatchLaterCommand {
  clickTrackingParams: string;
  commandMetadata: CommandMetadata4;
  playlistEditEndpoint: PlaylistEditEndpoint;
}

export interface CommandMetadata4 {
  webCommandMetadata: WebCommandMetadata4;
}

export interface WebCommandMetadata4 {
  sendPost: boolean;
  apiUrl: string;
}

export interface PlaylistEditEndpoint {
  playlistId: string;
  actions: Action[];
}

export interface Action {
  addedVideoId: string;
  action: string;
}

export interface RemoveFromWatchLaterCommand {
  clickTrackingParams: string;
  commandMetadata: CommandMetadata5;
  playlistEditEndpoint: PlaylistEditEndpoint2;
}

export interface CommandMetadata5 {
  webCommandMetadata: WebCommandMetadata5;
}

export interface WebCommandMetadata5 {
  sendPost: boolean;
  apiUrl: string;
}

export interface PlaylistEditEndpoint2 {
  playlistId: string;
  actions: Action2[];
}

export interface Action2 {
  action: string;
  removedVideoId: string;
}

export interface Storyboards {
  playerStoryboardSpecRenderer: PlayerStoryboardSpecRenderer;
}

export interface PlayerStoryboardSpecRenderer {
  spec: string;
  recommendedLevel: number;
  highResolutionRecommendedLevel: number;
}

export interface Microformat {
  playerMicroformatRenderer: PlayerMicroformatRenderer;
}

export interface PlayerMicroformatRenderer {
  thumbnail: Thumbnail3;
  embed: Embed;
  title: Title;
  description: Description;
  lengthSeconds: string;
  ownerProfileUrl: string;
  externalChannelId: string;
  isFamilySafe: boolean;
  availableCountries: string[];
  isUnlisted: boolean;
  hasYpcMetadata: boolean;
  viewCount: string;
  category: string;
  publishDate: string;
  ownerChannelName: string;
  uploadDate: string;
  isShortsEligible: boolean;
}

export interface Thumbnail3 {
  thumbnails: Thumbnail4[];
}

export interface Thumbnail4 {
  url: string;
  width: number;
  height: number;
}

export interface Embed {
  iframeUrl: string;
  width: number;
  height: number;
}

export interface Title {
  simpleText: string;
}

export interface Description {
  simpleText: string;
}

export interface Cards {
  cardCollectionRenderer: CardCollectionRenderer;
}

export interface CardCollectionRenderer {
  cards: Card[];
  headerText: HeaderText;
  icon: Icon;
  closeButton: CloseButton;
  trackingParams: string;
  allowTeaserDismiss: boolean;
  logIconVisibilityUpdates: boolean;
}

export interface Card {
  cardRenderer: CardRenderer;
}

export interface CardRenderer {
  teaser: Teaser;
  cueRanges: CueRange[];
  trackingParams: string;
}

export interface Teaser {
  simpleCardTeaserRenderer: SimpleCardTeaserRenderer;
}

export interface SimpleCardTeaserRenderer {
  message: Message;
  trackingParams: string;
  prominent: boolean;
  logVisibilityUpdates: boolean;
  onTapCommand: OnTapCommand;
}

export interface Message {
  simpleText: string;
}

export interface OnTapCommand {
  clickTrackingParams: string;
  changeEngagementPanelVisibilityAction: ChangeEngagementPanelVisibilityAction;
}

export interface ChangeEngagementPanelVisibilityAction {
  targetId: string;
  visibility: string;
}

export interface CueRange {
  startCardActiveMs: string;
  endCardActiveMs: string;
  teaserDurationMs: string;
  iconAfterTeaserMs: string;
}

export interface HeaderText {
  simpleText: string;
}

export interface Icon {
  infoCardIconRenderer: InfoCardIconRenderer;
}

export interface InfoCardIconRenderer {
  trackingParams: string;
}

export interface CloseButton {
  infoCardIconRenderer: InfoCardIconRenderer2;
}

export interface InfoCardIconRenderer2 {
  trackingParams: string;
}

export interface Attestation {
  playerAttestationRenderer: PlayerAttestationRenderer;
}

export interface PlayerAttestationRenderer {
  challenge: string;
  botguardData: BotguardData;
}

export interface BotguardData {
  program: string;
  interpreterSafeUrl: InterpreterSafeUrl;
  serverEnvironment: number;
}

export interface InterpreterSafeUrl {
  privateDoNotAccessOrElseTrustedResourceUrlWrappedValue: string;
}

export interface FrameworkUpdates {
  entityBatchUpdate: EntityBatchUpdate;
}

export interface EntityBatchUpdate {
  mutations: Mutation[];
  timestamp: Timestamp;
}

export interface Mutation {
  entityKey: string;
  type: string;
  payload: Payload;
}

export interface Payload {
  offlineabilityEntity: OfflineabilityEntity;
}

export interface OfflineabilityEntity {
  key: string;
  addToOfflineButtonState: string;
}

export interface Timestamp {
  seconds: string;
  nanos: number;
}
