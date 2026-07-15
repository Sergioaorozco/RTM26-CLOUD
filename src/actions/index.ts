import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { saveWord } from '../lib/firebase';

export const server = {
  saveWord: defineAction({
    input: z.object({
      text: z.string().trim().min(1),
    }),
    async handler({ text }) {
      const result = await saveWord(text);
      return { success: true, id: result.id, wordId: result.wordId };
    },
  }),
};
