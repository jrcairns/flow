"use client"

import { cn } from '@/lib/utils';
import { Handle, NodeToolbar, Position, useNodeId, useReactFlow, useStore, useUpdateNodeInternals } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button, buttonVariants } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Textarea } from './ui/textarea';
import { useSearchParams } from 'next/navigation';
import { Switch } from './ui/switch';
import { motion } from 'framer-motion'
import { Cable, ChevronLeft, Edit, Plug, Trash, Unplug } from 'lucide-react';
import { MacFrame } from './mac-frame';
import { MinimalTiptapEditor } from './ui/minimal-tiptap';

function QuestionNode({ data }) {
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

    const onRemoveClick = () => {
        setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    };

    const [value, setValue] = useState('')

    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >

            <NodeToolbar isVisible align="end" className="space-x-1 items-center flex">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon">
                            <Edit className="h-3 w-3" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="p-0 gap-0 [--gutter:theme(spacing.4)] shadow flex flex-col">
                        <SheetHeader className="p-[--gutter] border-b">
                            <SheetTitle>Node details</SheetTitle>
                            <SheetDescription>Manage your node details and answer tree below.</SheetDescription>
                        </SheetHeader>
                        <div className="p-[--gutter] space-y-4 flex-1 overflow-auto relative">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="question">Question</Label>
                                <Textarea
                                    rows={2}
                                    id="question"
                                    value={localData?.question}
                                    onChange={(e) => setLocalData(prevState => ({ ...prevState, question: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    rows={2}
                                    id="description"
                                    value={localData?.description}
                                    onChange={(e) => setLocalData(prevState => ({ ...prevState, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="multiple-choice"
                                    checked={localData?.multipleChoice || false}
                                    onCheckedChange={(checked) => setLocalData(prevState => ({ ...prevState, multipleChoice: checked }))}
                                />
                                <Label htmlFor="multiple-choice">Allow multiple answers</Label>
                            </div>
                            {localData?.options?.map((option, index) => (
                                <div className="flex flex-col space-y-1.5" key={option.id}>
                                    <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                                    <Input
                                        id={`option-${index}`}
                                        value={option.text}
                                        onChange={(e) => {
                                            const newOptions = [...localData?.options];
                                            newOptions[index] = { ...newOptions[index], text: e.target.value };
                                            setLocalData(prevState => ({ ...prevState, options: newOptions }))
                                        }}
                                    />
                                </div>
                            ))}
                            <Button onClick={addNewOption}>
                                Add Option
                            </Button>
                        </div>
                        <SheetFooter className="p-[--gutter] border-t relative">
                            <SheetClose asChild>
                                <Button variant="ghost">Close</Button>
                            </SheetClose>
                            <SheetClose asChild>
                                <Button onClick={updateNodeData}>Save</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
                <Button onClickCapture={onRemoveClick} className="hover:text-destructive hover:border-destructive/30" size="icon">
                    <Trash className="h-3 w-3" />
                </Button>
            </NodeToolbar>
            <MacFrame className="rounded-md relative border bg-background shadow group w-[500px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3/4 flex items-center justify-center text-center">
                    <Handle
                        type="target"
                        position={Position.Top}
                        id={`${nodeId}`}
                        style={{ position: "unset" }}
                        className={cn(
                            "rounded-md translate-x-0 border-border transition-colors duration-300 p-2 flex items-center justify-center h-7 w-7 mx-auto bg-background group-hover:border-foreground/30 whitespace-normal",
                        )}
                    >
                        <Unplug className="w-3 h-3 pointer-events-none rotate-180" />
                    </Handle>
                </div>
                <MinimalTiptapEditor
                    value={value}
                    onValueChange={setValue}
                    editorContentClassName="max-w-3xl mx-auto w-full"
                    content={`
                        <h2>${data?.question}</h2>
                        <p>${data?.description}</p>
                    `}
                />
                <div className="absolute px-2 translate-y-3/4 bottom-0 inset-x-0 grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${data?.options?.length}, minmax(0, 1fr))` }}>
                    {data?.options?.map((option, index) => (
                        <Handle
                            key={option.id}
                            type="source"
                            position={Position.Bottom}
                            id={option.id}
                            style={{ position: "unset" }}
                            className={cn(
                                "rounded-md translate-x-0 border-border transition-colors duration-300 flex items-center justify-center h-7 w-7 mx-auto bg-background group-hover:border-foreground/30 whitespace-normal",
                                // connectedOptionIds.has(option.id) ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-100" : "bg-muted dark:bg-muted/50"
                            )}
                        >
                            <Plug className="w-3 h-3 pointer-events-none rotate-180" />
                        </Handle>
                    ))}
                </div>
                {/* <div className="p-6 pt-0 text-center flex items-center justify-end space-x-2">
                    <Button disabled size="icon">
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="secondary">Continue</Button>
                </div> */}
            </MacFrame>
        </motion.div>
    );
}

export default memo(QuestionNode);