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
import { CardDemo } from './flow';

const CustomDocument = Document.extend({
    content: 'heading block*',
})

function ProcessNode({ data }) {
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


    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* <form onSubmit={e => {
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
            }} className="w-[500px] py-0 relative border bg-background shadow dark:bg-background backdrop-blur-sm items-center flex focus-within:outline rounded-md">
                <div className="border-r flex-1">
                    <Input disabled={isLoading} name="query" placeholder="6-8 questions, dentist, new client onboarding" className="placeholder:opacity-75 flex-1 focus-visible:ring-transparent shadow-none border-none bg-transparent" />
                </div>
                <Button variant="ghost" disabled={isLoading} className="hover:border-transparent min-w-24 rounded-sm shadow-none" type="submit">
                    Generate ✨
                </Button>
            </form> */}
            <CardDemo />
            {/* <div className={cn("transition-opacity duration-500", isPreviewMode && !isPreviewNodeSelected ? "opacity-30" : "opacity-100")}>
                <div className="relative group w-[500px] bg-background rounded-lg border shadow">
                    <div className="h-8 border-b rounded-t-xl px-2.5 relative flex items-center">
                        <div className="flex items-center space-x-1.5">
                            <span className="h-3.5 w-3.5 bg-red-500 rounded-full"></span>
                            <span className="h-3.5 w-3.5 bg-yellow-400 rounded-full"></span>
                            <span className="h-3.5 w-3.5 bg-green-500 rounded-full"></span>
                        </div>
                        <span className="absolute left-1/2 -translate-x-1/2 font-medium text-muted-foreground text-sm">https://quiz.flowcala.com</span>
                    </div>
                    <MinimalTiptapEditor
                        value={value}
                        onValueChange={setValue}
                        editorContentClassName="max-w-3xl mx-auto w-full"
                    />
                    <div className="p-6 pt-0 text-center">
                        <Button variant="secondary">Let&apos;s start</Button>
                    </div>
                </div>
            </div> */}

        </motion.div>
    );
}

export default memo(ProcessNode);