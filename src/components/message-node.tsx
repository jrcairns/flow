"use client"

import { Handle, Position, useNodeId, useReactFlow, useStore } from '@xyflow/react';
import { memo, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Textarea } from './ui/textarea';
import { useSearchParams } from 'next/navigation';

// @ts-ignore
function MessageNode({ data }) {
    const nodeId = useNodeId();

    const params = useSearchParams()
    const isPreviewMode = params.get("dialog") === "preview"
    const isPreviewNodeSelected = params.get("node") == nodeId

    const { setNodes, getEdges } = useReactFlow();
    const [localData, setLocalData] = useState(data);

    const updateNodeData = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === nodeId ? { ...node, data: localData } : node
        ));
    };

    return (
        <div className={cn("transition-opacity duration-500", isPreviewMode && !isPreviewNodeSelected ? "opacity-20" : "opacity-100")}>
            <div className="font-mono mb-4 text-xs">
                {`${nodeId!.padStart(2, '0')}.`}
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button className="p-4 pl-6 relative !text-base items-start flex-col h-auto group min-w-[20rem] max-w-xs w-full !whitespace-normal text-left">
                        <Handle
                            type="target"
                            position={Position.Top}
                            id={`${nodeId}`}
                            className="w-3/5 h-4 rounded-md border-border transition-colors bg-background group-hover:border-foreground/30 whitespace-normal"
                        />

                        <span className="text-base line-clamp-2">{data.heading}</span>
                        <span className="text-sm text-muted-foreground line-clamp-2">{data.description}</span>
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
                                value={localData.heading}
                                onChange={(e) => setLocalData({ ...localData, question: e.target.value })}
                            />
                        </div>
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

export default memo(MessageNode);