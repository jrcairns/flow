"use client"

import { cn } from '@/lib/utils';
import { useNodeId, useReactFlow, useStore, useUpdateNodeInternals } from '@xyflow/react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import { useSearchParams } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { MinimalTiptapEditor } from './ui/minimal-tiptap';

import Document from '@tiptap/extension-document';
import { MacFrame } from './mac-frame';
import { Skeleton } from './ui/skeleton';

const CustomDocument = Document.extend({
    content: 'heading block*',
})

function GetStartedNode({ data }) {
    const nodeId = useNodeId();

    const params = useSearchParams()
    const isPreviewMode = params.get("dialog") === "preview"
    const isPreviewNodeSelected = params.get("node") == nodeId

    const { setNodes } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const [localData, setLocalData] = useState(data);

    const edges = useStore((store) => store.edges);

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

    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            <MacFrame className="relative group w-[800px] bg-background rounded-lg border">
                <div className="bg-muted/70 dark:bg-muted/25 pt-1 flex">
                    <div className="flex-1 space-y-4 p-4">
                        <div className="space-y-0.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3.5 w-48" />
                            <Skeleton className="h-3.5 w-40" />
                        </div>
                        <div className="space-y-0.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3.5 w-48" />
                            <Skeleton className="h-3.5 w-40" />
                        </div>
                        <div className="space-y-0.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3.5 w-48" />
                            <Skeleton className="h-3.5 w-40" />
                        </div>
                        <div className="space-y-0.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3.5 w-48" />
                            <Skeleton className="h-3.5 w-40" />
                        </div>
                    </div>
                    <div className="rounded-l-md border border-r-0 rounded-br-md border-b-0 rounded-bl-none bg-background w-3/5 flex flex-col items-center justify-center">
                        <MinimalTiptapEditor
                            autofocus="end"
                            content={`
                        <h1>Welcome to Company's Client Quiz!</h1>
                        <p>Hey, thanks for stopping by.</p>
                        <p>Let's jump in when you're ready.</p>
                    `}
                            value={value}
                            onValueChange={setValue}
                            editorContentClassName="max-w-3xl mx-auto w-full"
                        />
                        <div className="p-6 pt-0 text-center">
                            {/* <Button variant="secondary">Let&apos;s start</Button> */}
                            <Skeleton className="h-6 w-16 animate-none" />
                        </div>
                    </div>
                </div>
            </MacFrame>
        </motion.div>
    );
}

export default memo(GetStartedNode);