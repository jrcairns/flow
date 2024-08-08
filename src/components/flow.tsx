"use client"

import { cn } from '@/lib/utils';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/nextjs';
import { faker } from '@faker-js/faker';
import { DoubleArrowRightIcon } from '@radix-ui/react-icons';
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
import { Check, ChevronLeft, ChevronUp, Info, Loader2, Menu, UploadCloud, X } from "lucide-react";
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MessageNode from './message-node';
import { Project } from './project';
import { ProjectNavigation } from './project-navigation';
import QuestionNode from './question-node';
import { Sidebar } from './sidebar';
import { Badge } from './ui/badge';
import { Button, buttonVariants } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent } from './ui/popover';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { experimental_useObject as useObject } from 'ai/react'
import { multipleNodesSchema } from '@/app/api/generate/schema';
import { toast } from 'sonner';

const nodeTypes = {
    question: QuestionNode,
    message: MessageNode
};

const VERTICAL_SPACING = 200;

export const Flow = ({ initialNodes, initialEdges, className }: { initialNodes: Node[], initialEdges: Edge[], className?: string }) => {
    const { isSignedIn } = useUser()
    const params = useSearchParams()
    const currentNodeId = params.get("node")
    const connectingNodeId = useRef(null);
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const { screenToFlowPosition, setCenter, getNodes, getViewport } = useReactFlow();

    const createEdgesFromNodes = useCallback((nodes: any[]) => {
        const edges: Edge[] = [];
        nodes?.forEach(node => {
            if (node.data && node.data.options) {
                node.data.options.forEach(option => {
                    if (option.nextNodeId) {
                        edges.push({
                            id: `e${node.id}-${option.id}`,
                            source: node.id,
                            sourceHandle: option.id,
                            target: option.nextNodeId,
                            animated: true,
                            type: ConnectionLineType.Step,
                        });
                    }
                });
            }
        });
        return edges;
    }, []);

    const adjustNodePositions = useCallback((nodes: any[]) => {
        console.log("Input nodes to adjustNodePositions:", nodes);

        if (!Array.isArray(nodes) || nodes.length === 0) {
            console.warn("Invalid or empty nodes array");
            return [];
        }

        const rowMap = new Map<number, any[]>();
        const ySpacing = 300; // Vertical spacing between rows

        nodes.forEach((node, index) => {
            if (!node.position || typeof node.position.y !== 'number') {
                console.warn(`Invalid node position for node ${index}:`, node);
                node.position = { x: 0, y: index * ySpacing };
            }
            const y = Math.round(node.position.y / ySpacing) * ySpacing;
            if (!rowMap.has(y)) rowMap.set(y, []);
            rowMap.get(y)!.push(node);
        });

        console.log("Row map:", Array.from(rowMap.entries()));

        const adjustedNodes = [];
        const xSpacing = 400; // Horizontal spacing between nodes

        rowMap.forEach((rowNodes, y) => {
            const count = rowNodes.length;
            const totalWidth = (count - 1) * xSpacing;
            const startX = -totalWidth / 2;

            rowNodes.forEach((node, index) => {
                const adjustedNode = {
                    ...node,
                    position: {
                        x: startX + index * xSpacing,
                        y: y
                    }
                };
                adjustedNodes.push(adjustedNode);
            });
        });

        console.log("Adjusted nodes:", adjustedNodes);
        return adjustedNodes;
    }, []);

    const addEdgesWithInterval = (newEdges, index = 0) => {
        if (index >= newEdges.length) {
            return; // All edges have been added
        }

        setEdges(prevEdges => [...prevEdges, newEdges[index]]);

        setTimeout(() => {
            addEdgesWithInterval(newEdges, index + 1);
        }, 50);
    };

    const handleSetEdges = (newEdges) => {
        setEdges([]); // Clear existing edges
        addEdgesWithInterval(newEdges);
    };

    const { submit, isLoading, object } = useObject({
        api: '/api/generate',
        schema: multipleNodesSchema,
        onFinish({ object }) {
            const newNodes = object.nodes
            setNodes(newNodes)
            const newEdges = createEdgesFromNodes(newNodes);
            console.log("Number of nodes before adjustment:", object.nodes.length);
            console.log("Number of nodes after adjustment:", newNodes.length);
            console.log("Number of new edges:", newEdges.length);

            setNodes(prevNodes => {
                console.log("Previous nodes:", prevNodes);
                console.log("New nodes:", newNodes);
                return newNodes;
            });
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

                // Start adding edges with delay
                addEdgeWithDelay(0);

                // Return an empty array to clear existing edges immediately
                return [];
            });

        }
    });

    const router = useRouter()

    useEffect(() => {
        setNodes(object?.nodes?.filter(node => !!node.type && !!node.id && !!node.position && !!node.measured) ?? [])
    }, [object?.nodes?.length])

    const onConnect = useCallback((connection) => {
        if (connection.source && connection.target && connection.sourceHandle) {
            setNodes((nds) => {
                return nds.map((node) => {
                    if (node.id === connection.source) {
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
                type: ConnectionLineType.Step
            };

            setEdges((eds) => addEdge(newEdge, eds));
        }
    }, [setNodes, setEdges]);

    const onConnectStart = useCallback((_, props) => {
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
                        description: faker.lorem.sentence(),
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
                    type: ConnectionLineType.Step
                };

                setEdges((eds) => eds.concat(newEdge));

                const { x, y, zoom } = getViewport();
                const nodeIsInView = (
                    newNodePosition.x >= x && newNodePosition.x <= x + window.innerWidth / zoom &&
                    newNodePosition.y >= y && newNodePosition.y <= y + window.innerHeight / zoom
                );

                if (!nodeIsInView) {
                    const padding = 50;
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
                    x: 0,
                    y: newNodeY
                },
                data: {
                    question: 'New Question',
                    description: "New question description",
                    multipleChoice: false,
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
                    x: 0,
                    y: newNodeY
                },
                data: {
                    heading: "Thank you for registering",
                    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, eos!"
                }
            };

            const updatedNodes = [...nds, newNode];

            const { x, y, zoom } = viewport;
            const nodeIsInView = (
                newNode.position.y >= y && newNode.position.y <= y + window.innerHeight / zoom
            );

            if (!nodeIsInView) {
                setTimeout(() => {
                    setCenter(0, newNode.position.y, { zoom, duration: 500 });
                }, 100);
            }

            return updatedNodes;
        });

        setEdges((eds) => {
            const nodes = getNodes();
            const newEdges = [];

            nodes.forEach(node => {
                if (node.type === 'question') {
                    // @ts-ignore
                    node.data?.options?.forEach(option => {
                        const nextNodeExists = nodes.some(n => n.id === option.nextNodeId);
                        if (!option.nextNodeId || !nextNodeExists) {
                            newEdges.push({
                                id: `e${node.id}-${option.id}-${newNodeId}`,
                                source: node.id,
                                sourceHandle: option.id,
                                target: newNodeId,
                                animated: true,
                                type: ConnectionLineType.Step
                            });

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

    useEffect(() => {
        if (currentNodeId) {
            const current = nodes.find(node => node.id === currentNodeId)

            if (current) {
                setTimeout(() => {
                    setCenter(current.position.x, current.position.y, { zoom: 1, duration: 1000 });
                }, 100);
            }
        }
    }, [currentNodeId])

    return (
        <React.Fragment>
            <div className="flex h-full">
                {/* <div className="fixed top-0 left-0 bg-black text-white z-50">{isLoading ? 'loading' : 'not loading'}</div> */}
                <div className="flex-1 @container z-10 relative">
                    {params.get("dialog") === "preview" && (
                        <div className="absolute right-0 top-1/3 translate-x-1/2 z-10">
                            <Button onClick={() => {
                                const newSearchParams = new URLSearchParams(params);
                                newSearchParams.delete("dialog");
                                newSearchParams.delete("node");
                                const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
                                router.push(newPathname);
                                setTimeout(centerOnFirstNode, 600)
                            }} size="icon">
                                <DoubleArrowRightIcon className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                    <ReactFlow
                        className={cn("bg-muted/50 dark:bg-muted/15 relative", className)}
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
                        connectionLineType={ConnectionLineType.Step}
                        nodeOrigin={[0.5, 0.5]}
                        proOptions={{
                            hideAttribution: true
                        }}
                    >
                        <div className='[mask-image:radial-gradient(55vw_circle_at_50%,white,transparent)] pointer-events-none absolute inset-0 h-full w-full'>
                            <Background className="dark:opacity-70" />
                        </div>
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

                        <Panel className="hidden @[64rem]:block max-w-md w-full" position="top-center">
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
                            }} className="relative h-9 shadow rounded-md bg-background/50 dark:bg-muted/30 backdrop-blur-sm items-center border !hover:border-foreground/30 flex text-muted-foreground hover:text-foreground transition-colors pr-px">
                                <Input disabled={isLoading} name="query" placeholder="6-8 questions, dentist, new client onboarding" className="placeholder:opacity-50 text-muted-foreground flex-1 focus-visible:ring-transparent border-none bg-transparent" />
                                <Button disabled={isLoading} className="min-w-24 shadow-none" type="submit">
                                    Generate ✨
                                </Button>
                            </form>
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
                            <Button
                                disabled={params.get("dialog") === "preview"}
                                onClick={() => {
                                    const newSearchParams = new URLSearchParams(params);
                                    newSearchParams.set("dialog", "preview")
                                    newSearchParams.set("node", getNodes()?.[0]?.id)
                                    const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
                                    router.push(newPathname);
                                    setTimeout(centerOnFirstNode, 600)
                                }}
                            >
                                Preview
                            </Button>
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
                                        <PopoverClose asChild>
                                            <Button size="icon" className="absolute right-2 top-0 -translate-y-1/2">
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </PopoverClose>
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
                <div className={cn("flex items-center justify-center transition-all duration-1000 @container relative", params.get("dialog") === "preview" ? "w-[500px] opacity-100" : "w-0 opacity-0")}>
                    {!!nodes.length ? (
                        <Preview nodes={nodes} edges={edges} />
                    ) : <div>no nodes</div>}
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
        </React.Fragment>
    );
};

export function Preview({ nodes, edges }: PreviewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { getNode } = useReactFlow();

    const questionNodes = useMemo(() => nodes.filter(node => node.type === 'question'), [nodes]);

    const [answers, setAnswers] = useState<Record<string, string[]>>({});

    const [path, setPath] = useState<string[]>(() => {
        const nodeParam = searchParams.get('node');
        return nodeParam ? [nodeParam] : (questionNodes.length > 0 ? [questionNodes[0].id] : []);
    });

    const [branchStack, setBranchStack] = useState<string[]>([]);

    const currentNodeId = path[path.length - 1];
    const currentNode = questionNodes.find(node => node.id === currentNodeId);

    useEffect(() => {
        if (currentNodeId) {
            updateURL(currentNodeId);
        }
    }, [currentNodeId]);

    const updateURL = (nodeId: string) => {
        if (nodeId) {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set("node", nodeId);
            const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
            router.push(newPathname);
        }
    };

    const handleAnswerChange = (nodeId: string, optionId: string, isChecked: boolean) => {
        setAnswers(prev => {
            const currentAnswers = prev[nodeId] || [];
            const isMultipleChoice = currentNode?.data?.multipleChoice || false;

            if (isMultipleChoice) {
                if (isChecked) {
                    return { ...prev, [nodeId]: [...currentAnswers, optionId] };
                } else {
                    return { ...prev, [nodeId]: currentAnswers.filter(id => id !== optionId) };
                }
            } else {
                // For single choice, always replace the answer
                return { ...prev, [nodeId]: [optionId] };
            }
        });
    };

    const handleNext = () => {
        if (!currentNode || !answers[currentNode.id]?.length) return;

        const selectedOptionIds = answers[currentNode.id];
        const nextNodes = selectedOptionIds.map(optionId => {
            const option = currentNode.data.options.find(opt => opt.id === optionId);
            return option?.nextNodeId;
        }).filter(Boolean);

        if (nextNodes.length > 0) {
            setBranchStack(prev => [...prev, ...nextNodes.slice(1)]);
            setPath(prev => [...prev, nextNodes[0]]);
        } else if (branchStack.length > 0) {
            const nextBranch = branchStack[0];
            setBranchStack(prev => prev.slice(1));
            setPath(prev => [...prev, nextBranch]);
        } else {
            console.log('End of questions reached');
        }
    };

    const handlePrevious = () => {
        if (path.length > 1) {
            setPath(prev => prev.slice(0, -1));
            // Reset branch stack when going back
            setBranchStack([]);
        }
    };

    if (!currentNode) return null;

    const isMultipleChoice = currentNode.data?.multipleChoice || false;
    const filteredOptions = currentNode.data?.options?.filter(option => !!option.nextNodeId) || [];

    return (
        <div className="relative space-y-6 px-4 flex flex-col justify-between transition opacity-0 @[500px]:opacity-100 duration-200 flex-shrink-0 w-full h-full">
            <div className="space-y-4">
                <Button size="icon" onClick={handlePrevious} disabled={path.length <= 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <div>
                    <h3 className="text-lg font-semibold">{currentNode.data.question}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{currentNode.data.description}</p>
                </div>
            </div>
            <div key={currentNode.id} className="space-y-4">
                {isMultipleChoice ? (
                    filteredOptions.map(option => (
                        <div key={option.id} className="flex items-center relative">
                            <Checkbox
                                className="peer sr-only"
                                id={option.id}
                                checked={answers[currentNode.id]?.includes(option.id)}
                                onCheckedChange={(checked) => handleAnswerChange(currentNode.id, option.id, checked === true)}
                            />
                            <Check className="hidden peer-data-[state=checked]:block w-3.5 h-3.5 z-10 absolute right-4" />
                            <label htmlFor={option.id} className="cursor-pointer flex items-center text-sm font-medium border p-4 rounded-md w-full shadow-inner text-muted-foreground opacity-70 peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:bg-muted/30 peer-data-[state=checked]:outline outline-2 outline-offset-2 outline-border peer-data-[state=checked]:text-foreground transition-all leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {option.text}
                            </label>
                        </div>
                    ))
                ) : (
                    <RadioGroup
                        value={answers[currentNode.id]?.[0] || ''}
                        onValueChange={(value) => handleAnswerChange(currentNode.id, value, true)}
                    >
                        {filteredOptions.map(option => (
                            <div key={option.id} className="flex items-center relative">
                                <RadioGroupItem className="peer sr-only" value={option.id} id={option.id} />
                                <Check className="hidden peer-data-[state=checked]:block w-3.5 h-3.5 z-10 absolute right-4" />
                                <label htmlFor={option.id} className="cursor-pointer flex items-center text-sm font-medium border p-4 rounded-md w-full shadow-inner text-muted-foreground opacity-70 peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:bg-muted/30 peer-data-[state=checked]:outline outline-2 outline-offset-2 outline-border peer-data-[state=checked]:text-foreground transition-all leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {option.text}
                                </label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
            </div>
            <Button size="default" onClick={handleNext} disabled={!answers[currentNode.id]?.length}>
                Next
            </Button>
        </div>
    );
}

// Types and interfaces

interface PreviewProps {
    nodes: any[];
    edges: any[];
}