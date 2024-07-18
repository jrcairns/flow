"use client"

import React, { memo, useMemo, useState } from 'react';
import { Handle, Position, useNodeId, useReactFlow, useStore } from '@xyflow/react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';
import { useDirection } from './flow';

// @ts-ignore
function QuestionNode({ data }) {
    const direction = "TR"
    // const { direction } = useDirection()
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const [localData, setLocalData] = useState(data);

    const edges = useStore((store) => store.edges);

    const connectedOptionIds = useMemo(() => {
        return new Set(edges.filter(edge => edge.source === nodeId).map(edge => edge.sourceHandle));
    }, [edges, nodeId]);

    const updateNodeData = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === nodeId ? { ...node, data: localData } : node
        ));
    };

    return (
        <div>
            <div className="font-mono mb-4 text-xs">
                {`${nodeId!.padStart(2, '0')}.`}
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button className="p-4 pl-6 relative !text-base items-start flex-col h-auto group w-[320px] !whitespace-normal text-left">
                        <Handle
                            type="target"
                            position={direction === "LR" ? Position.Left : Position.Top}
                            id={`${nodeId}`}
                            className="w-3/5 h-4 rounded-md border-border transition-colors bg-background group-hover:border-foreground/30 whitespace-normal"
                        />
                        <div className="absolute px-2 translate-y-1/2 bottom-0 inset-x-0 grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${localData?.options?.length}, minmax(0, 1fr))` }}>
                            {/* @ts-ignore */}
                            {localData?.options?.map((option, index) => (
                                <Handle
                                    key={option.id}
                                    type="source"
                                    position={Position.Bottom}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        alert('hit')
                                    }}
                                    id={option.id}
                                    style={{ position: "unset" }}
                                    className={cn(
                                        "rounded-md h-3 w-full translate-x-0 border-border transition-colors mx-auto bg-background group-hover:border-foreground/30 whitespace-normal",
                                        connectedOptionIds.has(option.id) ? "bg-green-500 dark:bg-green-700" : "bg-yellow-500 dark:bg-yellow-700"
                                    )}
                                />
                            ))}
                        </div>

                        <Badge className="rounded-full mb-1.5 !text-xs">{localData.options?.length ?? 0} answers</Badge>
                        <span className="line-clamp-2 min-h-[2lh] text-base">{data.question}</span>
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
                                onChange={(e) => setLocalData({ ...localData, question: e.target.value })}
                            />
                        </div>
                        {/* @ts-ignore */}
                        {localData?.options?.map((option, index) => (
                            <div className="flex flex-col space-y-1.5" key={index}>
                                <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                                <Input
                                    id={`option-${index}`}
                                    value={option.text}
                                    onChange={(e) => {
                                        const newOptions = [...localData.options];
                                        newOptions[index] = { ...newOptions[index], text: e.target.value };
                                        setLocalData({ ...localData, options: newOptions });
                                    }}
                                />
                            </div>
                        ))}
                        <Button onClick={() => setLocalData({
                            ...localData,
                            options: [...localData.options, { id: nanoid(), text: '', nextNodeId: null }]
                        })}>
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