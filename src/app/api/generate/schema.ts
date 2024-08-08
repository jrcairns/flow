import { z } from 'zod';

const nodeOptionSchema = z.object({
    id: z.string().describe(
        'ID of the option. Use the following format: ' +
        'answer_nanoid() //=> "answer_Uakgb_J5m9g-0JDMbcJqL"'
    ),
    text: z.string().describe('A suitable answer for the question in context'),
    nextNodeId: z.string().optional().describe("Use this to point specific answers to specific next question nodes during our smart quiz. We will use any answer nodes with nextNodeId values to generate out edges.")
})

// Define the schema for a single node
const nodeSchema = z.object({
    id: z.string().describe(
        'ID of the node. Use the following format: ' +
        'question_nanoid() //=> "question_Uakgb_J5m9g-0JDMbcJqL"'
    ),
    measured: z.object({
        width: z.literal(320).describe('width of the element. This must always be 320.'),
        height: z.literal(142).describe('height of the element. This must always be 142.')
    }),
    position: z.object({
        x: z.number().describe('x position of the element relative to other nodes. nodes should be spaced out on the x axis by 400 each node. You can use negative values here.'),
        y: z.number().describe('y position of the element relative to other nodes. nodes should be spaced out on the y axis by 210 each node. You can use negative values here.')
    }).describe('Lay out our node elements vertically on the y axis.'),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    type: z.literal("question").describe("This must be of value 'question'"),
    data: z.object({
        question: z.string().describe('Suitable question you would ask a user to obtain more information to determine our most suitable product for their personal situation.'),
        description: z.string().describe("A short subtext/description for our question."),
        multipleChoice: z.boolean().describe("If a question should allow multiple select, toggle this to true."),
        options: z.array(nodeOptionSchema).min(2).max(8).describe('An array of answers. There should be at least 2 answers, or as many as you see fit for the question.')
    }).describe('The question node data displayed to users on our website.')
});

// Define the schema for multiple nodes
const multipleNodesSchema = z.object({
    nodes: z.array(nodeSchema).min(2).max(15).describe('An array of question nodes. Number of nodes provided in context or between 5-15.')
});

// Export both schemas for use in other parts of your application
export { nodeSchema, multipleNodesSchema };

// You can also export a type if you need it for TypeScript
export type MultipleNodes = z.infer<typeof multipleNodesSchema>;
export type Node = z.infer<typeof nodeSchema>;