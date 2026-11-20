import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KnowledgeChunkDocument = KnowledgeChunk & Document;

@Schema({
  collection: 'knowledge_chunks',
  timestamps: true,
})
export class KnowledgeChunk {
  @Prop({ required: true, index: true })
  source: string;

  @Prop({ required: true })
  section: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, unique: true, index: true })
  contentHash: string;

  @Prop({ type: [Number], default: [] })
  embedding: number[];
}

export const KnowledgeChunkSchema = SchemaFactory.createForClass(KnowledgeChunk);
KnowledgeChunkSchema.index(
  { section: 'text', content: 'text' },
  { weights: { section: 3, content: 1 }, name: 'knowledge_text_index' },
);
