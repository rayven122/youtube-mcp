/**
 * VTT parse result type
 */
export type VttParsedResult = {
  entries: {
    id: string;
    from: number;
    to: number;
    text: string;
  }[];
};
