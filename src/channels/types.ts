/** What every channel adapter produces: normalised text plus provenance. */
export interface InboundMessage {
  text: string;
  meta?: Record<string, string>;
}
