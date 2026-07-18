export interface SaveWordRequestBody {
  text: string;
}

export interface SaveWordResult {
  id: string;
  wordId: string;
}

export interface SaveWordResponse {
  success: boolean;
  message?: string;
  results?: SaveWordResult[];
  body?: SaveWordRequestBody;
}

export interface WordCloudItem {
  text: string;
  count: number;
}
