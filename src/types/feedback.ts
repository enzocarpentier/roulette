export type CommentType = 'bug' | 'improvement' | 'note';

export interface DevComment {
  id: string;
  author: string;
  text: string;
  type: CommentType;
  xPct: number; // 0 to 100
  yPct: number; // 0 to 100
  createdAt: string;
  resolved: boolean;
}
