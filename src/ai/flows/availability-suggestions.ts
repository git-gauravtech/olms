// availability-suggestions.ts
'use server';
/**
 * @fileOverview Suggests alternative lab time slots based on AI analysis of lab schedules and booking patterns.
 *
 * - suggestAlternativeSlots - A function that suggests alternative lab slots.
 * - SuggestAlternativeSlotsInput - The input type for the suggestAlternativeSlots function.
 * - SuggestAlternativeSlotsOutput - The return type for the suggestAlternativeSlots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeSlotsInputSchema = z.object({
  labName: z.string().describe('The name of the lab for which to suggest alternative slots.'),
  preferredSlot: z.string().describe('The preferred time slot that is unavailable.'),
  bookingPatterns: z.string().describe('The booking patterns for the lab, including historical data and current bookings.'),
});
export type SuggestAlternativeSlotsInput = z.infer<typeof SuggestAlternativeSlotsInputSchema>;

const SuggestAlternativeSlotsOutputSchema = z.object({
  suggestedSlots: z.array(z.string()).describe('An array of suggested alternative time slots.'),
  reasoning: z.string().describe('The reasoning behind the suggested slots, based on booking patterns.'),
});
export type SuggestAlternativeSlotsOutput = z.infer<typeof SuggestAlternativeSlotsOutputSchema>;

export async function suggestAlternativeSlots(input: SuggestAlternativeSlotsInput): Promise<SuggestAlternativeSlotsOutput> {
  return suggestAlternativeSlotsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAlternativeSlotsPrompt',
  input: {schema: SuggestAlternativeSlotsInputSchema},
  output: {schema: SuggestAlternativeSlotsOutputSchema},
  prompt: `You are an AI assistant that suggests alternative time slots for lab bookings.

The user's preferred time slot is unavailable. Based on the lab's booking patterns, suggest 3 alternative time slots.

Lab Name: {{{labName}}}
Preferred Slot: {{{preferredSlot}}}
Booking Patterns: {{{bookingPatterns}}}

Consider the following factors when suggesting alternative slots:
- Historical booking data
- Current bookings
- Duration of bookings
- Frequency of bookings

Output the suggestions in a JSON format.
`,
});

const suggestAlternativeSlotsFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeSlotsFlow',
    inputSchema: SuggestAlternativeSlotsInputSchema,
    outputSchema: SuggestAlternativeSlotsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
