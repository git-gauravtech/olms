
'use server';
/**
 * @fileOverview Centralized Genkit configuration and AI object.
 *
 * Exports:
 * - ai: The global GenkitPluginRegistry and FlowRunner instance.
 */

import { genkit, type GenkitError } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-ai'; // Using Google AI provider

// Initialize Genkit with the Google AI plugin
// Ensure GOOGLE_API_KEY is set in your environment variables.
export const ai = genkit({
  plugins: [
    googleAI(), // You can add model and other configurations here if needed
                // e.g., googleAI({ apiKey: process.env.GOOGLE_API_KEY })
                // but typically, it will pick up GOOGLE_API_KEY from the environment.
  ],
  // As per v1.x guidance, logLevel is not configured here.
  // It can be set via environment variables if needed (e.g., GENKIT_LOG_LEVEL=debug)
});

// Optional: A helper function to handle Genkit errors gracefully
export function handleGenkitError(error: unknown, context?: string): string {
  const prefix = context ? `Error in ${context}: ` : 'An AI error occurred: ';
  if (isGenkitError(error)) {
    console.error(`${prefix}GenkitError - Code: ${error.code}, Message: ${error.message}, Details:`, error.details);
    return `${prefix}${error.message} (Code: ${error.code})`;
  } else if (error instanceof Error) {
    console.error(`${prefix}Generic Error - Name: ${error.name}, Message: ${error.message}`);
    return `${prefix}${error.message}`;
  } else {
    console.error(`${prefix}Unknown error object:`, error);
    return `${prefix}An unknown error occurred.`;
  }
}

function isGenkitError(error: any): error is GenkitError {
  return error && typeof error === 'object' && 'isGenkitError' in error && error.isGenkitError === true;
}
