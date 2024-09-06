"use client"

import { cn } from '@/lib/utils';
import { Edge, Node, useNodeId, useReactFlow, useStore, useUpdateNodeInternals } from '@xyflow/react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import { useSearchParams } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { MinimalTiptapEditor } from './ui/minimal-tiptap';

import Document from '@tiptap/extension-document';
import { Input } from './ui/input';
import { experimental_useObject } from 'ai/react';
import { multipleNodesSchema } from '@/app/api/generate/schema';
import { toast } from 'sonner';
import { MacFrame } from './mac-frame';
import { Skeleton } from './ui/skeleton';
import { FileUpload } from './ui/file-upload';
import { Textarea } from './ui/textarea';
import { Loader, Loader2 } from 'lucide-react';

const CustomDocument = Document.extend({
    content: 'heading block*',
})

function GenerateNode({ data }) {
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

    const [value, setValue] = useState('')

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

    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className="w-[800px] space-y-12">
                <div className="space-y-2 w-[36rem] mx-auto">
                    <p className="font-mono opacity-50 text-xs">Let AI help generate you a starting off point.</p>
                    <div className="relative z-40">
                        <form onSubmit={e => {
                            e.preventDefault();
                            const input = e.currentTarget.query as HTMLInputElement;
                            if (input.value.trim()) {
                                // @ts-ignore
                                toast.promise(submit({ prompt: input.value }), {
                                    loading: "Generating your quiz",
                                    success: "Quiz generated successfully"
                                })
                                e.currentTarget.reset();
                            }
                        }}>
                            <div className="relative">
                                <Input disabled={isLoading} name="query" placeholder={`6-8 questions, dentist, new client onboarding`} className="bg-background placeholder:opacity-50" />

                            </div>
                            <div className="mt-2 flex justify-end">
                                <Button variant="secondary" disabled={isLoading} type="submit">
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Generate <span className="dark:hidden">✨</span></span>}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                {/* <div className="flex items-center">
                    <div className="flex-1 border-b"></div>
                    <span className="px-4 font-mono opacity-50">OR</span>
                    <div className="flex-1 border-b"></div>
                </div>
                <div className="w-full max-w-4xl mx-auto">
                    <FileUpload files={files} setFiles={setFiles} />
                </div> */}
            </div>
        </motion.div>
    );
}

export default memo(GenerateNode);