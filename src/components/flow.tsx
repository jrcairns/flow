"use client"

import { cn } from '@/lib/utils';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/nextjs';
import { faker } from '@faker-js/faker';
import { PopoverClose, PopoverTrigger } from '@radix-ui/react-popover';
import { useMutation } from '@tanstack/react-query';
import {
    addEdge,
    Background,
    ConnectionLineType,
    Edge,
    Node,
    Panel,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { ArrowLeftToLine, ArrowRightToLine, ChevronUp, Info, Loader2, Menu, UploadCloud, X } from "lucide-react";
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import MessageNode from './message-node';
import QuestionNode from './question-node';
import { Sidebar } from './sidebar';
import { Badge } from './ui/badge';
import { Button, buttonVariants } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent } from './ui/popover';
import { ProjectNavigation } from './project-navigation';
import { Project } from './project';
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { Card, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const nodeTypes = {
    question: QuestionNode,
    message: MessageNode
};

const VERTICAL_SPACING = 200; // Adjust this value as needed

export const Flow = ({ initialNodes, initialEdges, className }: { initialNodes: Node[], initialEdges: Edge[], className?: string }) => {
    const { isSignedIn } = useUser()

    const params = useSearchParams()

    const connectingNodeId = useRef(null);
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const { screenToFlowPosition, setCenter, getNodes, getViewport } = useReactFlow();

    const router = useRouter()

    // @ts-ignore
    const onConnect = useCallback((connection) => {
        if (connection.source && connection.target && connection.sourceHandle) {
            setNodes((nds) => {
                return nds.map((node) => {
                    if (node.id === connection.source) {
                        // @ts-ignore
                        const updatedOptions = node.data.options.map(opt =>
                            opt.id === connection.sourceHandle ? { ...opt, nextNodeId: connection.target } : opt
                        );
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                options: updatedOptions
                            }
                        };
                    }
                    return node;
                });
            });

            const newEdge: Edge = {
                id: `e${connection.sourceHandle}-${connection.target}`,
                source: connection.source,
                sourceHandle: connection.sourceHandle,
                target: connection.target,
                animated: true,
                type: ConnectionLineType.SmoothStep
            };

            setEdges((eds) => addEdge(newEdge, eds));
        }
    }, [setNodes, setEdges]);

    // @ts-ignore
    const onConnectStart = useCallback((_, props) => {
        // @ts-ignore
        connectingNodeId.current = {
            nodeId: props.nodeId,
            handleId: props.handleId
        };
    }, []);

    const onConnectEnd = useCallback(
        (event) => {
            const connecting = connectingNodeId.current;
            if (!connecting) return;

            const targetIsPane = event.target.classList.contains('react-flow__pane');

            if (targetIsPane) {
                const id = `question_${nanoid()}`;
                const existingNodes = getNodes();
                const sourceNode = existingNodes.find(node => node.id === connecting.nodeId);

                if (!sourceNode) return;

                const newNodePosition = screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });

                const newNode = {
                    id,
                    position: newNodePosition,
                    type: "question",
                    data: {
                        question: faker.lorem.sentence(),
                        options: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }).map(() => ({
                            id: `answer_${nanoid()}`,
                            text: faker.lorem.words({ min: 1, max: 5 }),
                            nextNodeId: null
                        }))
                    },
                };

                setNodes((nds) => {
                    const updatedNodes = nds.concat(newNode);
                    const updatedSourceNode = updatedNodes.find(node => node.id === connecting.nodeId);
                    if (updatedSourceNode) {
                        // @ts-ignore
                        updatedSourceNode.data.options = updatedSourceNode.data.options.map(opt =>
                            opt.id === connecting.handleId ? { ...opt, nextNodeId: id } : opt
                        );
                    }
                    return updatedNodes;
                });

                const newEdge: Edge = {
                    id: `e${connecting.handleId}-${id}`,
                    source: connecting.nodeId,
                    sourceHandle: connecting.handleId,
                    target: id,
                    animated: true,
                    type: ConnectionLineType.SmoothStep
                };

                setEdges((eds) => eds.concat(newEdge));

                // Check if the new node is in view
                const { x, y, zoom } = getViewport();
                const nodeIsInView = (
                    newNodePosition.x >= x && newNodePosition.x <= x + window.innerWidth / zoom &&
                    newNodePosition.y >= y && newNodePosition.y <= y + window.innerHeight / zoom
                );

                // Only adjust view if the new node is out of view
                if (!nodeIsInView) {
                    const padding = 50; // Adjust this value as needed
                    setCenter(
                        newNodePosition.x,
                        newNodePosition.y,
                        { zoom, duration: 500 }
                    );
                }
            }
            connectingNodeId.current = null;
        },
        [screenToFlowPosition, setNodes, setEdges, getNodes, getViewport, setCenter]
    );

    const addNewQuestion = useCallback(() => {
        const newNodeId = `question_${nanoid()}`;

        setNodes((nds) => {
            const existingNodes = getNodes();
            const lastNode = existingNodes[existingNodes.length - 1];
            const viewport = getViewport();

            const newNodeY = lastNode ? lastNode.position.y + VERTICAL_SPACING : 0;

            const newNode = {
                id: newNodeId,
                type: 'question',
                position: {
                    x: 0, // Keep x position constant
                    y: newNodeY
                },
                data: {
                    question: 'New Question',
                    options: [
                        {
                            id: `answer_${nanoid()}`,
                            text: 'Option 1',
                            nextNodeId: null
                        },
                        {
                            id: `answer_${nanoid()}`,
                            text: 'Option 2',
                            nextNodeId: null
                        }
                    ]
                }
            };

            const updatedNodes = [...nds, newNode];

            // Center the view on the new node
            setTimeout(() => {
                setCenter(0, newNodeY, { zoom: viewport.zoom, duration: 1000 });
            }, 100);

            return updatedNodes;
        });
    }, [setNodes, getNodes, setCenter, getViewport]);

    const addFinalNode = useCallback(() => {
        const newNodeId = `question_${nanoid()}`;

        setNodes((nds) => {
            const existingNodes = getNodes();
            const lastNode = existingNodes[existingNodes.length - 1];
            const viewport = getViewport();

            const newNodeY = lastNode ? lastNode.position.y + VERTICAL_SPACING : 0;

            const newNode = {
                id: newNodeId,
                type: "message",
                position: {
                    x: 0, // Center horizontally
                    y: newNodeY
                },
                data: {
                    heading: "Thank you for registering",
                    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, eos!"
                }
            };

            const updatedNodes = [...nds, newNode];

            // Check if the new node is in view
            const { x, y, zoom } = viewport;
            const nodeIsInView = (
                newNode.position.y >= y && newNode.position.y <= y + window.innerHeight / zoom
            );

            // Only adjust view if the new node is out of view
            if (!nodeIsInView) {
                setTimeout(() => {
                    setCenter(0, newNode.position.y, { zoom, duration: 500 });
                }, 100);
            }

            return updatedNodes;
        });

        // Connect unconnected question node options to the new Final Node
        setEdges((eds) => {
            const nodes = getNodes();
            const newEdges = [];

            nodes.forEach(node => {
                if (node.type === 'question') {
                    // @ts-ignore
                    node.data.options.forEach(option => {
                        // Check if this option doesn't have a next node or if its next node doesn't exist
                        const nextNodeExists = nodes.some(n => n.id === option.nextNodeId);
                        if (!option.nextNodeId || !nextNodeExists) {
                            newEdges.push({
                                id: `e${node.id}-${option.id}-${newNodeId}`,
                                source: node.id,
                                sourceHandle: option.id,
                                target: newNodeId,
                                animated: true,
                                type: ConnectionLineType.SmoothStep
                            });

                            // Update the option's nextNodeId
                            option.nextNodeId = newNodeId;
                        }
                    });
                }
            });

            return [...eds, ...newEdges];
        });

    }, [setNodes, getNodes, setCenter, getViewport, setEdges]);

    const centerOnFirstNode = useCallback(() => {
        const nodes = getNodes();
        if (nodes.length > 0) {
            const firstNode = nodes[0];
            const { x, y } = firstNode.position;
            const { zoom } = getViewport();

            setCenter(x, y, { zoom, duration: 1000 });
        }
    }, [getNodes, getViewport, setCenter]);

    const mutation = useMutation({
        mutationKey: undefined,
        mutationFn: async () => {
            const payload = {
                name: nameRef.current.value,
                map: {
                    nodes, edges
                }
            }
            const response = await fetch("/api/publish", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json"
                }
            })

            const data = await response.json()

            return data
        },
        onSuccess(data) {
            router.push(`/p/${data.id}`)
        },
    })

    const handleLocalPublish = () => {
        localStorage.setItem("flowcala", JSON.stringify({
            nodes,
            edges
        }))

        router.push("/?dialog=auth")
    }

    useEffect(() => {
        centerOnFirstNode();
    }, [centerOnFirstNode]);

    return (
        <React.Fragment>
            <div className="flex h-full">
                <div className="flex-1 @container z-10 relative">
                    {params.get("dialog") === "preview" && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                            <Button onClick={() => {
                                const newSearchParams = new URLSearchParams(params);
                                newSearchParams.delete("dialog");
                                newSearchParams.delete("node");
                                const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
                                router.push(newPathname);
                                setTimeout(centerOnFirstNode, 500)
                            }} size="icon">
                                <DoubleArrowRightIcon className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                    <ReactFlow
                        className={cn("bg-muted dark:bg-background relative", className)}
                        nodeTypes={nodeTypes}
                        nodes={nodes}
                        edges={edges}
                        minZoom={.3}
                        maxZoom={.9}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        panOnScroll
                        fitView
                        snapToGrid
                        connectionLineType={ConnectionLineType.Bezier}
                        nodeOrigin={[0.5, 0.5]}
                        proOptions={{
                            hideAttribution: true
                        }}
                    >
                        <div className='[mask-image:radial-gradient(55vw_circle_at_50%,white,transparent)] pointer-events-none absolute inset-0 h-full w-full'>
                            <Background className="dark:opacity-70" />
                        </div>
                        {/* <Controls /> */}
                        <SignedIn>
                            <Panel className="space-x-2 flex" position="top-left">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon">
                                            <Menu className="w-3.5 h-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 origin-top-left p-0" side="right" sideOffset={-32} align="start">
                                        <Sidebar />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Project>
                                    <ProjectNavigation />
                                </Project>
                            </Panel>
                        </SignedIn>
                        <SignedOut>
                            <Panel position="top-left">
                                <Link href="/?dialog=auth" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>Log in</Link>
                            </Panel>
                        </SignedOut>

                        <SignedIn>
                            <Panel className="flex" position="bottom-left">
                                <UserButton />
                            </Panel>
                        </SignedIn>

                        <Panel className="hidden @[64rem]:block max-w-md w-full mt-5" position="top-center">
                            <div className="cursor-not-allowed relative h-9 shadow rounded-md bg-muted/30 backdrop-blur-sm items-center border !hover:border-foreground/30 flex text-muted-foreground hover:text-foreground transition-colors pr-px">
                                <Input disabled placeholder="6-8 questions, dentist, new client onboarding" className="placeholder:opacity-50 text-foreground flex-1 focus-visible:ring-transparent border-none bg-transparent" />
                                <Button disabled>
                                    Generate ✨
                                </Button>
                                <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 bg-muted/50 backdrop-blur-sm border text-[11px] px-1 text-muted-foreground/50 rounded-md">Coming soon 🎉</div>
                            </div>
                        </Panel>

                        <Panel className="space-x-2" position="bottom-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button>Add node <ChevronUp className="h-3.5 w-3.5 ml-2" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="text-xs">
                                    <DropdownMenuItem onClick={addNewQuestion} className="text-xs">
                                        New question
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={addFinalNode} className="text-xs">
                                        Final message
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Panel>
                        <Panel className="space-x-2" position="top-right">
                            <Link onClick={() => setTimeout(centerOnFirstNode, 500)} className={cn(buttonVariants({ size: "sm", variant: "default" }))} href={{ query: { dialog: "preview", node: getNodes()?.[0]?.id } }}>Preview</Link>
                            {isSignedIn ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button className="min-w-[90px]" disabled={mutation.isPending}>
                                            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                                                <>
                                                    Publish
                                                    <UploadCloud className="ml-2 h-3.5 w-3.5" />
                                                </>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="origin-top-right" align="end" sideOffset={-32}>
                                        <form onSubmit={event => {
                                            event.preventDefault()
                                            mutation.mutate()
                                        }} className="space-y-4">
                                            <div className="flex flex-col space-y-1.5">
                                                <Input disabled={mutation.isPending} ref={nameRef} placeholder="project name" />
                                            </div>
                                            <PopoverClose asChild>
                                                <Button disabled={mutation.isPending} type="submit" variant="link" className="h-auto w-full">Create project</Button>
                                            </PopoverClose>
                                        </form>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <Button onClick={handleLocalPublish}>
                                    Publish <UploadCloud className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            )}
                        </Panel>

                        <Panel position="bottom-right">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button size="icon">
                                        <Info className="w-3.5 h-3.5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="origin-bottom-right space-y-2 text-sm p-0 border-none" align="end" side="top" sideOffset={-32}>
                                    <div className="rounded-md border p-4 bg-muted/10 relative">
                                        <span className="absolute right-2 top-0 bg-[#151211] text-[11px] rounded-md border px-2 py-1 block leading-none -translate-y-1/2 text-muted-foreground">Legend</span>
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex flex-col space-y-2.5">
                                                <Label className="text-muted-foreground">Question</Label>
                                                <div className="bg-background border rounded-md px-6 py-4 w-full relative">
                                                    <div className="bg-background absolute w-3/5 h-4 border rounded-md top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                                    <Badge className="rounded-full mb-1.5 !text-xs">2 answers</Badge>
                                                    <span className="text-muted-foreground line-clamp-2 min-h-[2lh]">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid non quis nobis quibusdam magnam voluptatem.</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 flex flex-col">
                                                <Label className="text-muted-foreground">Connected answer</Label>
                                                <div className="rounded-md h-3 w-full max-w-3/5 bg-green-500 dark:bg-green-700"></div>
                                            </div>
                                            <div className="space-y-2.5 flex flex-col">
                                                <Label className="text-muted-foreground">Disconnected answer</Label>
                                                <div className="rounded-md h-3 w-full max-w-3/5 bg-yellow-500 dark:bg-yellow-700"></div>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </Panel>
                    </ReactFlow>
                </div>
                <div className={cn("flex items-center justify-center transition-all duration-1000 @container relative", params.get("dialog") === "preview" ? "w-1/2 opacity-100" : "w-0 opacity-0")}>
                    <Preview nodes={nodes} edges={edges} />
                </div>
            </div>
            <Dialog
                open={params.get("dialog") === "auth"}
                onOpenChange={(value) => {
                    if (!value) {
                        const newSearchParams = new URLSearchParams(params);
                        newSearchParams.delete("dialog");
                        const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
                        router.push(newPathname);
                    }
                }}
            >
                <DialogContent className="max-w-none w-auto border-none p-0">
                    <div className="sr-only">
                        <DialogTitle>Login form</DialogTitle>
                    </div>
                    <SignIn />
                </DialogContent>
            </Dialog>

            {/* <Dialog
                open={params.get("dialog") === "preview"}
                onOpenChange={(value) => {
                    if (!value) {
                        const newSearchParams = new URLSearchParams(params);
                        newSearchParams.delete("dialog");
                        const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
                        router.push(newPathname);
                    }
                }}
            >
                <DialogContent className="w-[calc(100svw-theme(spacing.4)*2)] h-[calc(100svh-theme(spacing.4)*2)] max-w-none">
                    <div className="sr-only">
                        <DialogTitle>Preview</DialogTitle>
                    </div>
                    <p>test</p>
                </DialogContent>
            </Dialog> */}
        </React.Fragment>
    );
};

function Preview({ nodes, edges }: { nodes: Node[], edges: Edge[] }) {
    const params = useSearchParams()
    const router = useRouter()
    const currentNode = params.get("node")

    const [store, setStore] = useState(new Map())
    const [state, setState] = useState<string | undefined>(undefined)

    const node = nodes.find(x => x.id === currentNode)

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const data = Object.fromEntries(formData)

        store.set(Object.values(data)[0], Object.keys(data)[0])

        const newSearchParams = new URLSearchParams(params);
        newSearchParams.set("node", Object.values(data)[0] as string)
        const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
        router.push(newPathname);
    }

    function handlePrevious() {
        const currentNodeId = params.get("node");
        if (!currentNodeId) return; // If there's no current node, we can't go back

        const newSearchParams = new URLSearchParams(params);
        newSearchParams.set("node", store.get(currentNodeId));
        const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
        router.push(newPathname);

        // if (currentIndex > 0) {
        //     // If we're not at the first entry, we can go back
        //     const previousEntry = entries[currentIndex - 1];
        //     const previousNodeId = previousEntry[0]; // Use the key, which is now the node ID

        // const newSearchParams = new URLSearchParams(params);
        // newSearchParams.set("node", previousNodeId);
        // const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
        // router.push(newPathname);
        // } else if (currentIndex === 0) {
        //     // If we're at the first entry, remove the node parameter
        //     const newSearchParams = new URLSearchParams(params);
        //     newSearchParams.delete("node");
        //     const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
        //     router.push(newPathname);
        // } else {
        //     console.log("Current node not found in entries");
        // }
    }


    return (
        <form onSubmit={handleSubmit} className={cn("max-w-md space-y-6 p-8 transition duration-200 opacity-0 @lg:opacity-100 flex-shrink-0 w-full")}>
            <div className="space-y-2">
                {/* @ts-ignore */}
                <p className="text-balance text-sm font-medium whitespace-nowrap text-muted-foreground">{node?.data.question}</p>
            </div>
            <RadioGroup value={state} onValueChange={setState} name={node?.id} defaultValue={node?.data.options[0].id}>
                {/* @ts-ignore */}
                {node?.data.options?.filter(option => !!option.nextNodeId)?.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.nextNodeId} id={option.id} />
                        <Label htmlFor={option.id}>{option.text}</Label>
                    </div>
                ))}
            </RadioGroup>
            <div className="flex justify-between">
                {!!store.size && <Button onClick={handlePrevious} type="button">Previous</Button>}
                <Button disabled={!state} type="submit">Next</Button>
            </div>
        </form>
    )
}