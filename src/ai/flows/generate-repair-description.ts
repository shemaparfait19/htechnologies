'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a repair description and suggested remedies based on a brief problem description.
 *
 * - generateRepairDescription - The function to generate the repair description.
 * - GenerateRepairDescriptionInput - The input type for the generateRepairDescription function.
 * - GenerateRepairDescriptionOutput - The output type for the generateRepairDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRepairDescriptionInputSchema = z.object({
  deviceType: z.string().describe('The type of device being repaired (e.g., phone, laptop).'),
  brand: z.string().describe('The brand of the device (e.g., Samsung, Apple).'),
  model: z.string().describe('The model of the device (e.g., Galaxy S21, iPhone 13).'),
  problemDescription: z.string().describe('A brief description of the problem with the device.'),
});
export type GenerateRepairDescriptionInput = z.infer<
  typeof GenerateRepairDescriptionInputSchema
>;

const GenerateRepairDescriptionOutputSchema = z.object({
  suggestedDiagnosis: z
    .string()
    .describe('A suggested diagnosis of the device problem.'),
  suggestedRemedies: z
    .string()
    .describe('Suggested remedies to attempt to fix the device problem.'),
});
export type GenerateRepairDescriptionOutput = z.infer<
  typeof GenerateRepairDescriptionOutputSchema
>;

export async function generateRepairDescription(
  input: GenerateRepairDescriptionInput
): Promise<GenerateRepairDescriptionOutput> {
  return generateRepairDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRepairDescriptionPrompt',
  input: {schema: GenerateRepairDescriptionInputSchema},
  output: {schema: GenerateRepairDescriptionOutputSchema},
  prompt: `You are an expert repair technician. Based on the following information about a broken device, please provide a suggested diagnosis and some suggested remedies. Be brief and to the point.

Device Type: {{{deviceType}}}
Brand: {{{brand}}}
Model: {{{model}}}
Problem Description: {{{problemDescription}}}`,
});

const generateRepairDescriptionFlow = ai.defineFlow(
  {
    name: 'generateRepairDescriptionFlow',
    inputSchema: GenerateRepairDescriptionInputSchema,
    outputSchema: GenerateRepairDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
