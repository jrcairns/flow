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
            options: [...prevState.options, newOption]
        }));
    }, []);

    useEffect(() => {
        updateNodeInternals(nodeId);
    }, [localData.options, nodeId, updateNodeInternals]);

    return (
        <div className={cn("transition-opacity duration-500", isPreviewMode && !isPreviewNodeSelected ? "opacity-30" : "opacity-100")}>
            <div className="font-mono mb-4 text-xs text-muted-foreground peer-hover:text-foreground">
                {`${nodeId!.padStart(2, '0')}.`}
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button className="peer p-4 pl-6 relative !text-base items-start flex-col h-auto group w-[320px] !whitespace-normal text-left">
                        <Handle
                            type="target"
                            position={Position.Top}
                            id={`${nodeId}`}
                            className="w-3/5 h-4 rounded-md border-border transition-colors bg-background group-hover:border-foreground/30 whitespace-normal"
                        />
                        <div className="absolute px-2 translate-y-1/2 bottom-0 inset-x-0 grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${localData?.options?.length}, minmax(0, 1fr))` }}>
                            {localData?.options?.map((option, index) => (
                                <Handle
                                    key={option.id}
                                    type="source"
                                    position={Position.Bottom}
                                    id={option.id}
                                    style={{ position: "unset" }}
                                    className={cn(
                                        "rounded-md h-3 w-full max-w-3/5 translate-x-0 border-border transition-colors mx-auto bg-background group-hover:border-foreground/30 whitespace-normal",
                                        connectedOptionIds.has(option.id) ? "bg-green-500 dark:bg-green-700" : "bg-yellow-500 dark:bg-yellow-700"
                                    )}
                                />
                            ))}
                        </div>

                        <Badge className="rounded-full mb-1.5 !text-xs">{localData.options?.length ?? 0} answers</Badge>
                        <span className="line-clamp-2 min-h-[2lh] text-base">{localData.question}</span>
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
                                value={localData.question}
                                onChange={(e) => setLocalData(prevState => ({ ...prevState, question: e.target.value }))}
                            />
                        </div>
                        {localData?.options?.map((option, index) => (
                            <div className="flex flex-col space-y-1.5" key={option.id}>
                                <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                                <Input
                                    id={`option-${index}`}
                                    value={option.text}
                                    onChange={(e) => {
                                        const newOptions = [...localData.options];
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
    );
}

export default memo(QuestionNode);