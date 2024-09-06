"use client"

import { Edge, Node, useNodeId, useReactFlow, useStore, useUpdateNodeInternals } from '@xyflow/react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import { useSearchParams } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';

import { multipleNodesSchema } from '@/app/api/generate/schema';
import { experimental_useObject } from 'ai/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FileUpload } from './ui/file-upload';
import { Input } from './ui/input';
import { z } from 'zod';

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

function ImportNode({ data }) {
    const nodeId = useNodeId();

    const params = useSearchParams()
    const isPreviewMode = params.get("dialog") === "preview"
    const isPreviewNodeSelected = params.get("node") == nodeId

    const { setNodes, setEdges, setCenter, getViewport } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const [localData, setLocalData] = useState(data);

    const edges = useStore((store) => store.edges);
    const nodes = useStore((store) => store.nodes);

    const connectedOptionIds = useMemo(() => {
        return new Set(edges.filter(edge => edge.source === nodeId).map(edge => edge.sourceHandle));
    }, [edges, nodeId]);

    const updateNodeData = useCallback(() => {
        setNodes(nodes => nodes.map(node =>
            node.id === nodeId ? { ...node, data: localData } : node
        ));
        updateNodeInternals(nodeId);
    }, [nodeId, localData, setNodes, updateNodeInternals]);

    const addNewOption = useCallback(() => {
        const newOption = { id: `answer_${nanoid()}`, text: '', nextNodeId: null };
        setLocalData(prevState => ({
            ...prevState,
            options: [...prevState?.options, newOption]
        }));
    }, []);

    useEffect(() => {
        updateNodeInternals(nodeId);
    }, [localData?.options, data, nodeId, updateNodeInternals]);

    // const editor = useEditor({
    //     extensions: [
    //         CustomDocument,
    //         StarterKit.configure({
    //             document: false,
    //         }),
    //         Placeholder.configure({
    //             placeholder: ({ node }) => {
    //                 if (node.type.name === 'heading') {
    //                     return 'What’s the title?'
    //                 }

    //                 return 'Can you add some further context?'
    //             },
    //         }),
    //     ],
    //     content: `
    //       <h1>
    //         It’ll always have a heading …
    //       </h1>
    //       <p>
    //         … if you pass a custom document. That’s the beauty of having full control over the schema.
    //       </p>
    //     `,
    // })

    const createEdgesFromNodes = useCallback((nodes: Node[]) => {
        const edges: Edge[] = [];
        const createdEdges = new Set();

        nodes?.forEach(node => {
            if (node.data && node.data.options) {
                // @ts-ignore
                node.data?.options?.forEach(option => {
                    if (option.nextNodeId) {
                        const edgeKey = `${node.id}-${option.id}-${option.nextNodeId}`;

                        if (!createdEdges.has(edgeKey)) {
                            const edge: Edge = {
                                id: `e${edgeKey}-${nanoid(6)}`,
                                source: node.id,
                                sourceHandle: option.id,
                                target: option.nextNodeId,
                                animated: true,
                                type: "answer",
                                data: {
                                    label: option.text
                                }
                            };
                            edges.push(edge);
                            createdEdges.add(edgeKey);
                        }
                    }
                });
            }
        });
        return edges;
    }, []);

    const updateEdges = useCallback(() => {
        const newEdges = createEdgesFromNodes(nodes);
        setEdges(newEdges);
    }, [nodes, createEdgesFromNodes, setEdges]);

    useEffect(() => {
        updateEdges();
    }, [nodes, updateEdges]);

    const NODE_WIDTH = 500;

    const { submit, isLoading, object } = experimental_useObject({
        api: '/api/generate',
        schema: multipleNodesSchema,
        onFinish({ object }) {
            const newNodes = object.nodes;
            // @ts-ignore
            setNodes(prevNodes => {
                const updatedNodes = [...prevNodes, ...newNodes];
                if (newNodes.length > 0) {
                    const lastNode = newNodes[newNodes.length - 1];
                    const { zoom } = getViewport();

                    updatedNodes.push({
                        id: 'annotation-4',
                        type: 'annotation',
                        draggable: false,
                        selectable: false,
                        data: {
                            level: 4,
                            label:
                                "Setup how you want to process the input",
                            arrowStyle: {
                                right: 32,
                                bottom: -24,
                                position: "absolute",
                                transform: 'rotate(-80deg)',
                            },
                        },
                        position: { x: -250, y: lastNode.position.y + 250 },
                    },)

                    updatedNodes.push({
                        id: 'process',
                        type: 'process',
                        draggable: false,
                        selectable: false,
                        data: {
                            level: 1,
                            label:
                                "Setup how you want to process the input",
                            arrowStyle: {
                                right: 32,
                                bottom: -24,
                                position: "absolute",
                                transform: 'rotate(-80deg)',
                            },
                        },
                        position: { x: 0, y: lastNode.position.y + 360 },
                    },)

                    // updatedNodes.push({
                    //     id: 'process',
                    //     type: 'process',
                    //     position: {
                    //         x: 0,
                    //         y: newNodeY
                    //     },
                    //     data: {
                    //         question: 'New Question',
                    //         description: "New question description",
                    //         multipleChoice: false,
                    //         options: [
                    //             {
                    //                 id: `answer_${nanoid()}`,
                    //                 text: 'Option 1',
                    //                 nextNodeId: null
                    //             },
                    //             {
                    //                 id: `answer_${nanoid()}`,
                    //                 text: 'Option 2',
                    //                 nextNodeId: null
                    //             }
                    //         ]
                    //     }
                    // })

                    const centerX = lastNode.position.x + (NODE_WIDTH / 2 / zoom);
                    setCenter(centerX, lastNode.position.y, { zoom: 1, duration: 1000 });
                }
                return updatedNodes;
            });

            // @ts-ignore
            const newEdges = createEdgesFromNodes(newNodes);

            setEdges((prevEdges) => {
                const addEdgeWithDelay = (index) => {
                    if (index >= newEdges.length) {
                        return;
                    }

                    setTimeout(() => {
                        setEdges((currentEdges) => [...currentEdges, newEdges[index]]);
                        addEdgeWithDelay(index + 1);
                    }, 50);
                };

                addEdgeWithDelay(0);

                // Return an empty array to clear existing edges immediately
                return [];
            });

        }
    });

    const [files, setFiles] = useState<File[]>([]);

    const handleFileUpload = (files: File[]) => {
        setFiles(files);
    };

    // useEffect(() => {
    //     if (object) {
    //         // @ts-ignore
    //         setNodes(prevNodes => [...prevNodes, ...object?.nodes?.filter(node => !!node.type && !!node.id && !!node.position)])
    //     }
    // }, [object?.nodes?.length])

    useEffect(() => {
        if (object) {
            // @ts-ignore
            setNodes(prevNodes => {
                const validNewNodes = object?.nodes?.filter(node => !!node.type && !!node.id && !!node.position) || [];

                let updatedNodes = prevNodes;

                if (validNewNodes.length > 0) {
                    // Update annotation-3 to be visible when the first valid node is added
                    updatedNodes = prevNodes.map(node =>
                        node.id === 'annotation-3' ? { ...node, hidden: false } : node
                    );

                    const lastNode = validNewNodes[validNewNodes.length - 1];
                    const { zoom } = getViewport();
                    const centerX = lastNode.position.x + (NODE_WIDTH / 2 / zoom);
                    setCenter(centerX, lastNode.position.y, { zoom: 1, duration: 1000 });
                }

                return [...updatedNodes, ...validNewNodes];
            });
        }
    }, [object?.nodes?.length, setCenter, getViewport]);

    const onRemoveClick = () => {
        setNodes((nodes) => nodes.filter((node) => node.id !== nodeId && node.id !== "annotation-import"));
        const getStartedNode = nodes.find(node => node.id === "get-started")
        const { zoom } = getViewport();
        const centerX = getStartedNode.position.x + (800 / 2 / zoom);
        setCenter(centerX, 500, { zoom: 1, duration: 1000 });
    };

    const [value, setValue] = useState<File[]>([])

    const [status, setStatus] = useState<"idle" | "processing" | "passed" | "failed">("idle")

    const file = value?.[0] ?? null

    const jsonSchema = z.object({
        nodes: z.array(z.object({
            id: z.string().optional(),
            measured: z.object({
                width: z.number().optional(),
                height: z.number().optional()
            }),
            position: z.object({
                x: z.number().optional(),
                y: z.number().optional(),
            }),
            selected: z.boolean().optional(),
            dragging: z.boolean().optional(),
            type: z.string().optional(),
            data: z.object({
                question: z.string().optional(),
                description: z.string().optional(),
                multipleChoice: z.boolean().optional(),
                options: z.array(z.object({
                    id: z.string().optional(),
                    text: z.string().optional(),
                    nextNodeId: z.string().optional().nullable().optional()
                })).optional()
            }).optional()
        }))
    })

    useEffect(() => {
        if (file) {
            validate(file)
        }
    }, [file])

    function loadFromJson(value: { nodes: Node[], edges: Edge[] }) {
        setNodes(value.nodes)
        setEdges(value.edges)
    }

    async function validate(file: File) {
        console.log(file);
        setStatus("processing");

        try {
            // Read the file contents
            const fileContents = await readFileAsText(file);

            // Parse the file contents as JSON
            const jsonData = JSON.parse(fileContents);

            console.log(jsonData)

            // Validate the JSON data with Zod
            const parsed = jsonSchema.safeParse(jsonData);

            if (parsed.success) {
                console.log("Validation successful:", parsed.data);
                setStatus("passed");
            } else {
                console.log("Validation failed:", parsed.error.flatten());
                setStatus("failed");
            }
        } catch (error) {
            console.error("Error processing file:", error);
            setStatus("failed");
        }
    }

    // Helper function to read file contents
    function readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className="w-[800px]">
                <div className="w-full max-w-4xl mx-auto relative">
                    <FileUpload status={status} value={value} onValueChange={setValue} />
                    {file && status === "passed" && (
                        <motion.div
                            variants={secondaryVariant}
                        >
                            <div className="flex justify-end space-x-2 mt-2 w-[36rem] mx-auto">
                                <Button onClick={() => setValue([])} variant="ghost">Clear</Button>
                                <Button onClick={() => {
                                    loadFromJson({
                                        "nodes": [
                                            {
                                                "id": "question_10",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": 0,
                                                    "y": 2550
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "Would you like to schedule an appointment?",
                                                    "description": "Select if you would like to schedule an appointment with us.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_10a",
                                                            "text": "Yes"
                                                        },
                                                        {
                                                            "id": "answer_10b",
                                                            "text": "No"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_9",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": 300,
                                                    "y": 2050
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "How often do you train or exercise?",
                                                    "description": "Select your training or exercise frequency.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_9a",
                                                            "text": "Daily",
                                                            "nextNodeId": "question_10"
                                                        },
                                                        {
                                                            "id": "answer_9b",
                                                            "text": "Weekly",
                                                            "nextNodeId": "question_10"
                                                        },
                                                        {
                                                            "id": "answer_9c",
                                                            "text": "Occasionally",
                                                            "nextNodeId": "question_10"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_8",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": -300,
                                                    "y": 2050
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "Have you tried any treatments before?",
                                                    "description": "Select if you have tried any treatments for your condition.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_8a",
                                                            "text": "Yes",
                                                            "nextNodeId": "question_10"
                                                        },
                                                        {
                                                            "id": "answer_8b",
                                                            "text": "No",
                                                            "nextNodeId": "question_10"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_7",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": 600,
                                                    "y": 1550
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "Do you have any specific goals in mind?",
                                                    "description": "Select if you have specific performance goals.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_7a",
                                                            "text": "Yes",
                                                            "nextNodeId": "question_9"
                                                        },
                                                        {
                                                            "id": "answer_7b",
                                                            "text": "No",
                                                            "nextNodeId": "question_9"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_6",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": 0,
                                                    "y": 1550
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "What is your current level of mobility?",
                                                    "description": "Select your current mobility level.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_6a",
                                                            "text": "Fully mobile",
                                                            "nextNodeId": "question_8"
                                                        },
                                                        {
                                                            "id": "answer_6b",
                                                            "text": "Partially mobile",
                                                            "nextNodeId": "question_8"
                                                        },
                                                        {
                                                            "id": "answer_6c",
                                                            "text": "Limited mobility",
                                                            "nextNodeId": "question_8"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_5",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": -600,
                                                    "y": 1550
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "How long have you been experiencing this pain?",
                                                    "description": "Select the duration of your pain.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_5a",
                                                            "text": "Less than a month",
                                                            "nextNodeId": "question_8"
                                                        },
                                                        {
                                                            "id": "answer_5b",
                                                            "text": "1-6 months",
                                                            "nextNodeId": "question_8"
                                                        },
                                                        {
                                                            "id": "answer_5c",
                                                            "text": "More than 6 months",
                                                            "nextNodeId": "question_8"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_4",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 158
                                                },
                                                "position": {
                                                    "x": 900,
                                                    "y": 1050
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "What aspect of performance are you looking to improve?",
                                                    "description": "Select the area you want to focus on.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_4a",
                                                            "text": "Strength",
                                                            "nextNodeId": "question_7"
                                                        },
                                                        {
                                                            "id": "answer_4b",
                                                            "text": "Flexibility",
                                                            "nextNodeId": "question_7"
                                                        },
                                                        {
                                                            "id": "answer_4c",
                                                            "text": "Endurance",
                                                            "nextNodeId": "question_7"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_3",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": 300,
                                                    "y": 1050
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "What type of injury are you recovering from?",
                                                    "description": "Select the type of injury.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_3a",
                                                            "text": "Sports injury",
                                                            "nextNodeId": "question_6"
                                                        },
                                                        {
                                                            "id": "answer_3b",
                                                            "text": "Surgical recovery",
                                                            "nextNodeId": "question_6"
                                                        },
                                                        {
                                                            "id": "answer_3c",
                                                            "text": "Accidental injury",
                                                            "nextNodeId": "question_6"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_2",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": -300,
                                                    "y": 1050
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "Where are you experiencing pain?",
                                                    "description": "Select the area where you feel the most pain.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_2a",
                                                            "text": "Back",
                                                            "nextNodeId": "question_5"
                                                        },
                                                        {
                                                            "id": "answer_2b",
                                                            "text": "Neck",
                                                            "nextNodeId": "question_5"
                                                        },
                                                        {
                                                            "id": "answer_2c",
                                                            "text": "Shoulder",
                                                            "nextNodeId": "question_5"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "question_1",
                                                "measured": {
                                                    "width": 500,
                                                    "height": 130
                                                },
                                                "position": {
                                                    "x": 0,
                                                    "y": 550
                                                },
                                                "selected": false,
                                                "dragging": false,
                                                "type": "question",
                                                "data": {
                                                    "question": "What brings you to our physio clinic today?",
                                                    "description": "Please select the primary reason for your visit.",
                                                    "multipleChoice": false,
                                                    "options": [
                                                        {
                                                            "id": "answer_1a",
                                                            "text": "Pain management",
                                                            "nextNodeId": "question_2"
                                                        },
                                                        {
                                                            "id": "answer_1b",
                                                            "text": "Injury recovery",
                                                            "nextNodeId": "question_3"
                                                        },
                                                        {
                                                            "id": "answer_1c",
                                                            "text": "Performance improvement",
                                                            "nextNodeId": "question_4"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": "annotation-1",
                                                "type": "annotation",
                                                "draggable": false,
                                                "selectable": false,
                                                "data": {
                                                    "level": 1,
                                                    "label": "Customize your landing page copy.",
                                                    "arrowStyle": {
                                                        "right": 32,
                                                        "bottom": -24,
                                                        "position": "absolute",
                                                        "transform": "rotate(-80deg)"
                                                    }
                                                },
                                                "position": {
                                                    "x": -250,
                                                    "y": -100
                                                },
                                                "measured": {
                                                    "width": 256,
                                                    "height": 68
                                                }
                                            },
                                            {
                                                "id": "get-started",
                                                "type": "start",
                                                "draggable": false,
                                                "data": {
                                                    "question": "Thymbra depraedor vallum.",
                                                    "description": "Tollo optio tutis ambulo vito deinde trepide concedo libero cito.",
                                                    "options": [
                                                        {
                                                            "id": "answer_8GNZOAGSLeDgSuaeFhQHg",
                                                            "text": "quibusdam toties",
                                                            "nextNodeId": null
                                                        }
                                                    ]
                                                },
                                                "position": {
                                                    "x": 0,
                                                    "y": 0
                                                },
                                                "measured": {
                                                    "width": 500,
                                                    "height": 222
                                                }
                                            },
                                            {
                                                "id": "annotation-2",
                                                "type": "annotation",
                                                "draggable": false,
                                                "selectable": false,
                                                "data": {
                                                    "level": 2,
                                                    "label": "Let AI help you generate a starting off point.",
                                                    "arrowStyle": {
                                                        "left": 24,
                                                        "bottom": -24,
                                                        "position": "absolute",
                                                        "transform": "scaleX(-1) rotate(-60deg)"
                                                    }
                                                },
                                                "position": {
                                                    "x": 500,
                                                    "y": 275
                                                },
                                                "measured": {
                                                    "width": 256,
                                                    "height": 92
                                                }
                                            },
                                            {
                                                "id": "generate-quiz",
                                                "type": "generate",
                                                "draggable": false,
                                                "data": {
                                                    "question": "Circumvenio corporis aperte tribuo vilis aduro balbus.",
                                                    "description": "Laudantium stips timor terminatio distinctio vesco comburo venustas demergo amplexus.",
                                                    "options": [
                                                        {
                                                            "id": "answer_bdPQpCLrV6M5mNEoNLpAc",
                                                            "text": "defetiscor appono",
                                                            "nextNodeId": null
                                                        },
                                                        {
                                                            "id": "answer_X1NNU0mg3hGWWfPwdAOLB",
                                                            "text": "demonstro",
                                                            "nextNodeId": null
                                                        }
                                                    ]
                                                },
                                                "position": {
                                                    "x": 0,
                                                    "y": 375
                                                },
                                                "measured": {
                                                    "width": 500,
                                                    "height": 36
                                                },
                                                "selected": true
                                            }
                                        ],
                                        "edges": [
                                            {
                                                "id": "equestion_9-answer_9c-question_10-gTDsrY",
                                                "source": "question_9",
                                                "sourceHandle": "answer_9c",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Occasionally"
                                                }
                                            },
                                            {
                                                "id": "equestion_9-answer_9b-question_10-W4Jssh",
                                                "source": "question_9",
                                                "sourceHandle": "answer_9b",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Weekly"
                                                }
                                            },
                                            {
                                                "id": "equestion_9-answer_9a-question_10-gdk2kx",
                                                "source": "question_9",
                                                "sourceHandle": "answer_9a",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Daily"
                                                }
                                            },
                                            {
                                                "id": "equestion_8-answer_8b-question_10-_G29xa",
                                                "source": "question_8",
                                                "sourceHandle": "answer_8b",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "No"
                                                }
                                            },
                                            {
                                                "id": "equestion_8-answer_8a-question_10-UTDJLU",
                                                "source": "question_8",
                                                "sourceHandle": "answer_8a",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Yes"
                                                }
                                            },
                                            {
                                                "id": "equestion_7-answer_7b-question_9-O19VK9",
                                                "source": "question_7",
                                                "sourceHandle": "answer_7b",
                                                "target": "question_9",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "No"
                                                }
                                            },
                                            {
                                                "id": "equestion_7-answer_7a-question_9-Mv36sW",
                                                "source": "question_7",
                                                "sourceHandle": "answer_7a",
                                                "target": "question_9",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Yes"
                                                }
                                            },
                                            {
                                                "id": "equestion_6-answer_6c-question_8-h9ekwC",
                                                "source": "question_6",
                                                "sourceHandle": "answer_6c",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Limited mobility"
                                                }
                                            },
                                            {
                                                "id": "equestion_6-answer_6b-question_8-9WjIVG",
                                                "source": "question_6",
                                                "sourceHandle": "answer_6b",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Partially mobile"
                                                }
                                            },
                                            {
                                                "id": "equestion_6-answer_6a-question_8-SVkqpX",
                                                "source": "question_6",
                                                "sourceHandle": "answer_6a",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Fully mobile"
                                                }
                                            },
                                            {
                                                "id": "equestion_5-answer_5c-question_8-1RamYF",
                                                "source": "question_5",
                                                "sourceHandle": "answer_5c",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "More than 6 months"
                                                }
                                            },
                                            {
                                                "id": "equestion_5-answer_5b-question_8-_jWsaJ",
                                                "source": "question_5",
                                                "sourceHandle": "answer_5b",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "1-6 months"
                                                }
                                            },
                                            {
                                                "id": "equestion_5-answer_5a-question_8-9tDvbP",
                                                "source": "question_5",
                                                "sourceHandle": "answer_5a",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Less than a month"
                                                }
                                            },
                                            {
                                                "id": "equestion_4-answer_4c-question_7-O2nvrO",
                                                "source": "question_4",
                                                "sourceHandle": "answer_4c",
                                                "target": "question_7",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Endurance"
                                                }
                                            },
                                            {
                                                "id": "equestion_4-answer_4b-question_7-XtnIge",
                                                "source": "question_4",
                                                "sourceHandle": "answer_4b",
                                                "target": "question_7",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Flexibility"
                                                }
                                            },
                                            {
                                                "id": "equestion_4-answer_4a-question_7-9BzSP2",
                                                "source": "question_4",
                                                "sourceHandle": "answer_4a",
                                                "target": "question_7",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Strength"
                                                }
                                            },
                                            {
                                                "id": "equestion_3-answer_3c-question_6-E7xQ1F",
                                                "source": "question_3",
                                                "sourceHandle": "answer_3c",
                                                "target": "question_6",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Accidental injury"
                                                }
                                            },
                                            {
                                                "id": "equestion_3-answer_3b-question_6-yOPP_a",
                                                "source": "question_3",
                                                "sourceHandle": "answer_3b",
                                                "target": "question_6",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Surgical recovery"
                                                }
                                            },
                                            {
                                                "id": "equestion_3-answer_3a-question_6-HhJ-zS",
                                                "source": "question_3",
                                                "sourceHandle": "answer_3a",
                                                "target": "question_6",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Sports injury"
                                                }
                                            },
                                            {
                                                "id": "equestion_2-answer_2c-question_5-73OfHE",
                                                "source": "question_2",
                                                "sourceHandle": "answer_2c",
                                                "target": "question_5",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Shoulder"
                                                }
                                            },
                                            {
                                                "id": "equestion_2-answer_2b-question_5-pzQLPO",
                                                "source": "question_2",
                                                "sourceHandle": "answer_2b",
                                                "target": "question_5",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Neck"
                                                }
                                            },
                                            {
                                                "id": "equestion_2-answer_2a-question_5-BGdmbG",
                                                "source": "question_2",
                                                "sourceHandle": "answer_2a",
                                                "target": "question_5",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Back"
                                                }
                                            },
                                            {
                                                "id": "equestion_1-answer_1c-question_4-oP6GL0",
                                                "source": "question_1",
                                                "sourceHandle": "answer_1c",
                                                "target": "question_4",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Performance improvement"
                                                }
                                            },
                                            {
                                                "id": "equestion_1-answer_1b-question_3-dN2M_h",
                                                "source": "question_1",
                                                "sourceHandle": "answer_1b",
                                                "target": "question_3",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Injury recovery"
                                                }
                                            },
                                            {
                                                "id": "equestion_1-answer_1a-question_2-tN0HHS",
                                                "source": "question_1",
                                                "sourceHandle": "answer_1a",
                                                "target": "question_2",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Pain management"
                                                }
                                            },
                                            {
                                                "id": "equestion_9-answer_9a-question_10-2R4NN5",
                                                "source": "question_9",
                                                "sourceHandle": "answer_9a",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Daily"
                                                }
                                            },
                                            {
                                                "id": "equestion_9-answer_9b-question_10-hoa3Yy",
                                                "source": "question_9",
                                                "sourceHandle": "answer_9b",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Weekly"
                                                }
                                            },
                                            {
                                                "id": "equestion_9-answer_9c-question_10-GsyqhA",
                                                "source": "question_9",
                                                "sourceHandle": "answer_9c",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Occasionally"
                                                }
                                            },
                                            {
                                                "id": "equestion_8-answer_8a-question_10-u1ZiIE",
                                                "source": "question_8",
                                                "sourceHandle": "answer_8a",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Yes"
                                                }
                                            },
                                            {
                                                "id": "equestion_8-answer_8b-question_10-18ngWQ",
                                                "source": "question_8",
                                                "sourceHandle": "answer_8b",
                                                "target": "question_10",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "No"
                                                }
                                            },
                                            {
                                                "id": "equestion_7-answer_7a-question_9-Q4xd6T",
                                                "source": "question_7",
                                                "sourceHandle": "answer_7a",
                                                "target": "question_9",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Yes"
                                                }
                                            },
                                            {
                                                "id": "equestion_7-answer_7b-question_9-JZcwao",
                                                "source": "question_7",
                                                "sourceHandle": "answer_7b",
                                                "target": "question_9",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "No"
                                                }
                                            },
                                            {
                                                "id": "equestion_6-answer_6a-question_8-hfYvd3",
                                                "source": "question_6",
                                                "sourceHandle": "answer_6a",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Fully mobile"
                                                }
                                            },
                                            {
                                                "id": "equestion_6-answer_6b-question_8-HKbyuf",
                                                "source": "question_6",
                                                "sourceHandle": "answer_6b",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Partially mobile"
                                                }
                                            },
                                            {
                                                "id": "equestion_6-answer_6c-question_8-nI9NTF",
                                                "source": "question_6",
                                                "sourceHandle": "answer_6c",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Limited mobility"
                                                }
                                            },
                                            {
                                                "id": "equestion_5-answer_5a-question_8-pc5rcg",
                                                "source": "question_5",
                                                "sourceHandle": "answer_5a",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Less than a month"
                                                }
                                            },
                                            {
                                                "id": "equestion_5-answer_5b-question_8-Ip7GBC",
                                                "source": "question_5",
                                                "sourceHandle": "answer_5b",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "1-6 months"
                                                }
                                            },
                                            {
                                                "id": "equestion_5-answer_5c-question_8-08rB08",
                                                "source": "question_5",
                                                "sourceHandle": "answer_5c",
                                                "target": "question_8",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "More than 6 months"
                                                }
                                            },
                                            {
                                                "id": "equestion_4-answer_4a-question_7-cxOj6z",
                                                "source": "question_4",
                                                "sourceHandle": "answer_4a",
                                                "target": "question_7",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Strength"
                                                }
                                            },
                                            {
                                                "id": "equestion_4-answer_4b-question_7-XcErix",
                                                "source": "question_4",
                                                "sourceHandle": "answer_4b",
                                                "target": "question_7",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Flexibility"
                                                }
                                            },
                                            {
                                                "id": "equestion_4-answer_4c-question_7-TEbK8A",
                                                "source": "question_4",
                                                "sourceHandle": "answer_4c",
                                                "target": "question_7",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Endurance"
                                                }
                                            },
                                            {
                                                "id": "equestion_3-answer_3a-question_6-KwF7lc",
                                                "source": "question_3",
                                                "sourceHandle": "answer_3a",
                                                "target": "question_6",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Sports injury"
                                                }
                                            },
                                            {
                                                "id": "equestion_3-answer_3b-question_6-VNxPTg",
                                                "source": "question_3",
                                                "sourceHandle": "answer_3b",
                                                "target": "question_6",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Surgical recovery"
                                                }
                                            },
                                            {
                                                "id": "equestion_3-answer_3c-question_6-ZMzsiU",
                                                "source": "question_3",
                                                "sourceHandle": "answer_3c",
                                                "target": "question_6",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Accidental injury"
                                                }
                                            },
                                            {
                                                "id": "equestion_2-answer_2a-question_5-bb7BGP",
                                                "source": "question_2",
                                                "sourceHandle": "answer_2a",
                                                "target": "question_5",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Back"
                                                }
                                            },
                                            {
                                                "id": "equestion_2-answer_2b-question_5-gdGIwB",
                                                "source": "question_2",
                                                "sourceHandle": "answer_2b",
                                                "target": "question_5",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Neck"
                                                }
                                            },
                                            {
                                                "id": "equestion_2-answer_2c-question_5-ANz7FV",
                                                "source": "question_2",
                                                "sourceHandle": "answer_2c",
                                                "target": "question_5",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Shoulder"
                                                }
                                            },
                                            {
                                                "id": "equestion_1-answer_1a-question_2-qbZzoW",
                                                "source": "question_1",
                                                "sourceHandle": "answer_1a",
                                                "target": "question_2",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Pain management"
                                                }
                                            },
                                            {
                                                "id": "equestion_1-answer_1b-question_3-5C_UMb",
                                                "source": "question_1",
                                                "sourceHandle": "answer_1b",
                                                "target": "question_3",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Injury recovery"
                                                }
                                            },
                                            {
                                                "id": "equestion_1-answer_1c-question_4-uERDYP",
                                                "source": "question_1",
                                                "sourceHandle": "answer_1c",
                                                "target": "question_4",
                                                "animated": true,
                                                "type": "answer",
                                                "data": {
                                                    "label": "Performance improvement"
                                                }
                                            }
                                        ]
                                    })
                                }} variant="secondary">Load data</Button>
                            </div>
                        </motion.div>
                    )}

                    {!file && (
                        <div className="flex justify-center">
                            <Button onClick={onRemoveClick} className="mx-auto text-xs" variant="link">dismiss</Button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default memo(ImportNode);