import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai'
import { multipleNodesSchema } from './schema';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { prompt }: { prompt: string } = await req.json();
        console.log("Received prompt:", prompt);

        const numberMatch = prompt.match(/(\d+)(?:-(\d+))?\s*questions?/i);
        let questionInstruction = "create 5-8 question nodes";

        if (numberMatch) {
            if (numberMatch[2]) {
                // Range specified
                questionInstruction = `create ${numberMatch[1]} to ${numberMatch[2]} question nodes`;
            } else {
                // Single number specified
                questionInstruction = `create exactly ${numberMatch[1]} question nodes`;
            }
        }

        const result = await streamObject({
            model: openai("gpt-4o"),
            schema: multipleNodesSchema,
            prompt: `Generate a funnel-like quiz flow with question nodes based on this context: "${prompt}".
                 Follow these guidelines strictly:
                 1. ${questionInstruction}. This is a critical requirement.
                 2. Never exceed 15 question nodes, regardless of what's asked.
                 3. Create a branching structure where answers can lead to different follow-up questions:
                    - Start with a broad, general question.
                    - Based on the answer, lead to more specific questions.
                    - Allow for different paths through the quiz based on answers.
                    - Some answers may lead to the same follow-up question (converging paths).
                    - Ensure all paths eventually lead to a conclusion.
                 4. Each node must have:
                    - A unique ID in the format: question_[unique_string]
                    - A unique question relevant to the context.
                    - A brief description providing context for the question.
                    - 2-4 answer options, each potentially leading to a different next question.
                 5. Each answer option must have:
                    - A unique ID in the format: answer_[unique_string]
                    - Unique text content
                    - A 'nextNodeId' pointing to the next question node, if applicable
                 6. Ensure all IDs (for both questions and answers) are unique across the entire quiz structure.
                 7. Use the 'nextNodeId' in options to create the branching structure.
                 8. Position nodes to represent the funnel structure:
                    - Start with y = 575 for the first question.
                    - Increment y by 500 for each level of depth in the funnel.
                    - For nodes on the same level (same y value):
                      * Calculate the total number of nodes in the row.
                      * Space nodes horizontally with 600 units between each node.
                      * Center the group of nodes. For example:
                        - 1 node: x = 0
                        - 2 nodes: x = -300 and x = 300
                        - 3 nodes: x = -600, x = 0, and x = 600
                        - 4 nodes: x = -900, x = -300, x = 300, and x = 900
                      * Adjust this pattern for any number of nodes in a row.
                 9. Ensure the quiz flow logically narrows down information based on previous answers.
                 10. The quiz content should be directly relevant to the user's prompt.

                 Remember to interpret the user's request accurately, especially regarding the number of questions, and generate an engaging, branching quiz structure with unique IDs for all elements and properly centered rows.`,
            maxTokens: 2000,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error in API route:", error);
        return new Response(JSON.stringify({ error: "An error occurred while generating the quiz" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}