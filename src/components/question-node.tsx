"use client"

import { cn } from '@/lib/utils';
import { Handle, Position, useNodeId, useReactFlow, useStore, useUpdateNodeInternals } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Textarea } from './ui/textarea';
import { useSearchParams } from 'next/navigation';
import { Switch } from './ui/switch';
import { motion } from 'framer-motion'
import { Edit } from 'lucide-react';

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

    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className={cn("transition-opacity duration-500", isPreviewMode && !isPreviewNodeSelected ? "opacity-30" : "opacity-100")}>
                {/* <div className="font-mono mb-4 text-xs text-muted-foreground peer-hover:text-foreground">
                    {`${nodeId!.padStart(2, '0')}.`}
                </div> */}
                <div className="rounded-md relative border bg-background shadow-md group w-[320px]">
                    <Handle
                        type="target"
                        position={Position.Top}
                        id={`${nodeId}`}
                        className="w-3/5 h-4 rounded-md border-border transition-colors bg-background group-hover:border-foreground/30 whitespace-normal"
                    />
                    <div className="border-b bg-muted/70 dark:bg-background rounded-t-md">
                        <ol className="dark:text-muted-foreground list-decimal list-inside p-2 space-y-0.5 flex flex-col items-start">
                            {data?.options?.map((option, index) => (
                                <li className="text-xs bg-background py-1 px-2 leading-none rounded-full border" key={option.id}>{option.text}</li>
                            ))}
                        </ol>
                    </div>
                    <div className="p-4 relative dark:bg-background">
                        <p className="block leading-snug font-semibold text-sm mb-1">{data?.question}</p>
                        <p className="block leading-snug text-sm text-muted-foreground">{data?.description}</p>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="absolute -translate-y-1/2 top-0 right-2 shadow-none" size="icon">
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0 gap-0 [--gutter:theme(spacing.4)] flex flex-col">
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
                    </div>
                    <div className="absolute px-2 translate-y-1/2 bottom-0 inset-x-0 grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${data?.options?.length}, minmax(0, 1fr))` }}>
                        {data?.options?.map((option, index) => (
                            <Handle
                                key={option.id}
                                type="source"
                                position={Position.Bottom}
                                id={option.id}
                                style={{ position: "unset" }}
                                className={cn(
                                    "rounded-md h-2 w-full max-w-3/5 translate-x-0 border-border transition-colors mx-auto bg-background group-hover:border-foreground/30 whitespace-normal",
                                    connectedOptionIds.has(option.id) ? "bg-green-500 dark:bg-green-700" : "bg-yellow-500 dark:bg-yellow-700"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(QuestionNode);