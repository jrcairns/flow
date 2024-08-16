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
            <MacFrame className="relative group w-[500px] bg-background rounded-lg border shadow">
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
                    <Button variant="secondary">Let&apos;s start</Button>
                </div>
            </MacFrame>
        </motion.div>
    );
}

export default memo(GetStartedNode);