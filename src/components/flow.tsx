"use client"

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/nextjs';
import { faker } from '@faker-js/faker';
import { PopoverClose, PopoverTrigger } from '@radix-ui/react-popover';
import { useMutation } from '@tanstack/react-query';
import {
    addEdge,
    Background,
    BackgroundVariant,
    ConnectionLineType,
    Edge,
    Node,
    Panel,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow,
    useStore
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Check, ChevronLeft, ChevronUp, Info, Loader2, Menu, UploadCloud, X } from "lucide-react";
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AnnotationNode from './annotation-node';
import AnswerEdge from './answer-edge';
import { useDnD } from './dnd-context';
import GenerateNode from './generate-node';
import GetStartedNode from './get-started-node';
import ImportNode from './import-node';
import MessageNode from './message-node';
import ProcessNode from './process-node';
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

const nodeTypes = {
    question: QuestionNode,
    annotation: AnnotationNode,
    message: MessageNode,
    start: GetStartedNode,
    generate: GenerateNode,
    process: ProcessNode,
    import: ImportNode,
};

const edgeTypes = {
    answer: AnswerEdge,
};

const VERTICAL_SPACING = 200;

let id = 0;
const getId = () => `dndnode_${id++}`;

export const Flow = ({ initialNodes, initialEdges, className }: { initialNodes: Node[], initialEdges: Edge[], className?: string }) => {
    const { isSignedIn } = useUser()
    const params = useSearchParams()
    const currentNodeId = params.get("node")
    const connectingNodeId = useRef(null);
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const { screenToFlowPosition, setCenter, getNodes, getViewport } = useReactFlow();

    const [type] = useDnD();

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            // check if the dropped element is valid
            if (!type) {
                return;
            }

            // project was renamed to screenToFlowPosition
            // and you don't need to subtract the reactFlowBounds.left/top anymore
            // details: https://reactflow.dev/whats-new/2023-11-10
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = {
                id: getId(),
                type: "question",
                position,
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

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, type],
    );

    useEffect(() => {
        console.log('nodes changed')
    }, [onNodesChange])

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

    const router = useRouter()

    // useEffect(() => {
    //     if (object) {
    //         // @ts-ignore
    //         setNodes(object?.nodes?.filter(node => !!node.type && !!node.id && !!node.position && !!node.measured) ?? [])
    //     }
    // }, [object?.nodes?.length])

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

    return (
        <React.Fragment>
            <div className="flex h-full">
                {/* <div className="fixed top-0 left-0 bg-black text-white z-50">{isLoading ? 'loading' : 'not loading'}</div> */}
                {params.get("dialog") !== "preview" && (
                    <div className="flex-1 flex @container z-10 relative">
                        {/* {params.get("dialog") === "preview" && (
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
                    )} */}
                        {/* <div className='[mask-image:radial-gradient(55vw_circle_at_50%,white,transparent)] pointer-events-none absolute inset-0 h-full w-full'>
                            <Background className="dark:opacity-70 pointer-events-none absolute inset-0 h-full w-full" />
                        </div> */}
                        {/* <div className="mr-4">
                            <DndSidebar />
                        </div> */}
                        <ReactFlow
                            className={cn("bg-muted/50 dark:bg-muted/15 relative flex-1", className)}
                            nodeTypes={nodeTypes}
                            // @ts-ignore
                            edgeTypes={edgeTypes}
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onConnectStart={onConnectStart}
                            onConnectEnd={onConnectEnd}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            // panOnScroll
                            defaultViewport={{
                                zoom: 1,
                                x: (screen.width / 2) - (800 * 1) / 2,
                                y: 200
                            }}
                            maxZoom={1}
                            snapToGrid
                            connectionLineType={ConnectionLineType.SimpleBezier}
                            nodeOrigin={[0, 0]}
                            proOptions={{
                                hideAttribution: true
                            }}
                        >

                            <SignedIn>
                                <Panel className="space-x-2 flex" position="top-left">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon">
                                                <Menu className="w-3.5 h-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64 origin-top-left p-0" align="start">
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

                                        const width = 640;  // Specify your desired width
                                        const height = 500; // Specify your desired height

                                        const left = (screen.width - width) / 2;
                                        const top = (screen.height - height) / 2;

                                        window.open(
                                            `${window.location.pathname}?${newSearchParams.toString()}`,
                                            'Preview Window',
                                            `width=${width},height=${height},left=${left},top=${top},resizable=no`
                                        );
                                    }}
                                >
                                    Preview
                                </Button>
                                {isSignedIn ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button className="min-w-[90px]" disabled={mutation.isPending}>
                                                <span className="mr-2">Publish</span>
                                                {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
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
                            <Background variant={BackgroundVariant.Lines} gap={24} lineWidth={0.5} className="dark:opacity-[2%] opacity-70" />
                        </ReactFlow>
                    </div>
                )}
                <div className={cn("flex items-center justify-center transition-all duration-1000 @container relative", params.get("dialog") === "preview" ? "w-full opacity-100" : "w-0 opacity-0")}>
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

    const questionNodes = useMemo(() => nodes.filter(node => node.type === 'question' || node.type === 'start'), [nodes]);

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
        <div className="relative space-y-6 flex flex-col justify-between transition opacity-0 @[500px]:opacity-100 duration-200 flex-shrink-0 w-full h-full">
            <div className="space-y-4">
                {/* <Button size="icon" onClick={handlePrevious} disabled={path.length <= 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button> */}
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
            <div className="flex justify-end space-x-4">
                <Button size="icon" onClick={handlePrevious} disabled={path.length <= 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleNext} disabled={!answers[currentNode.id]?.length}>
                    Next
                </Button>
            </div>
        </div>
    );
}

// Types and interfaces

interface PreviewProps {
    nodes: any[];
    edges: any[];
}

import { animate, motion } from "framer-motion";

export function CardDemo() {
    return (
        <Card>
            <CardSkeletonContainer>
                <Skeleton />
            </CardSkeletonContainer>
            {/* <CardTitle>Damn good card</CardTitle>
            <CardDescription>
                A card that showcases a set of tools that you use to create your
                product.
            </CardDescription> */}
        </Card>
    );
}

const Skeleton = () => {
    const scale = [1, 1.1, 1];
    const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
    const sequence = [
        [
            ".circle-1",
            {
                scale,
                transform,
            },
            { duration: 0.8 },
        ],
        [
            ".circle-2",
            {
                scale,
                transform,
            },
            { duration: 0.8 },
        ],
        [
            ".circle-3",
            {
                scale,
                transform,
            },
            { duration: 0.8 },
        ],
        [
            ".circle-4",
            {
                scale,
                transform,
            },
            { duration: 0.8 },
        ],
        [
            ".circle-5",
            {
                scale,
                transform,
            },
            { duration: 0.8 },
        ],
    ];

    const nodes = useStore((store) => store.nodes);

    console.log({ nodes })

    useEffect(() => {
        // @ts-ignore
        animate(sequence, {
            repeat: Infinity,
            repeatDelay: 1,
        });
    }, []);
    return (
        <div className="overflow-hidden h-full relative flex items-center justify-center">
            <div className="flex flex-wrap justify-center items-center gap-2">
                {nodes?.filter(node => !!node?.data?.question).map(node => (
                    // @ts-ignore
                    <Container key={node.id}><span>{node.data.question}</span></Container>
                ))}
                {/* <Container className="">
                    <ClaudeLogo className="h-4 w-4 " />
                </Container>
                <Container className="h-12 w-12 circle-2">
                    <GoCopilot className="h-6 w-6 dark:text-white" />
                    T
                </Container>
                <Container className="circle-3">
                    <OpenAILogo className="h-8 w-8 dark:text-white" />
                </Container>
                <Container className="h-12 w-12 ">
                    <MetaIconOutline className="h-6 w-6 " />
                </Container>
                <Container className="h-8 w-8 circle-5">
                    <GeminiLogo className="h-4 w-4 " />
                </Container> */}
            </div>

            <div className="h-full w-px absolute top-0 m-auto z-40 bg-gradient-to-b from-transparent via-cyan-500 to-transparent animate-move">
                <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
                    <Sparkles />
                </div>
            </div>
        </div>
    );
};
const Sparkles = () => {
    const randomMove = () => Math.random() * 2 - 1;
    const randomOpacity = () => Math.random();
    const random = () => Math.random();
    return (
        <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
                <motion.span
                    key={`star-${i}`}
                    animate={{
                        top: `calc(${random() * 100}% + ${randomMove()}px)`,
                        left: `calc(${random() * 100}% + ${randomMove()}px)`,
                        opacity: randomOpacity(),
                        scale: [1, 1.2, 0],
                    }}
                    transition={{
                        duration: random() * 2 + 4,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        top: `${random() * 100}%`,
                        left: `${random() * 100}%`,
                        width: `2px`,
                        height: `2px`,
                        borderRadius: "50%",
                        zIndex: 1,
                    }}
                    className="inline-block bg-black dark:bg-white"
                ></motion.span>
            ))}
        </div>
    );
};

export const Card = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "w-[500px] mx-auto group",
                className
            )}
        >
            {children}
        </div>
    );
};

export const CardTitle = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <h3
            className={cn(
                "text-lg font-semibold text-gray-800 dark:text-white py-2",
                className
            )}
        >
            {children}
        </h3>
    );
};

export const CardDescription = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <p
            className={cn(
                "text-sm font-normal text-neutral-600 dark:text-neutral-400 max-w-sm",
                className
            )}
        >
            {children}
        </p>
    );
};

export const CardSkeletonContainer = ({
    className,
    children,
    showGradient = true,
}: {
    className?: string;
    children: React.ReactNode;
    showGradient?: boolean;
}) => {
    return (
        <div
            className={cn(
                "h-[15rem] md:h-[15rem] overflow-hidden rounded-xl z-40",
                className,
                // showGradient &&
                // "bg-neutral-300 dark:bg-[rgba(40,40,40,0.70)] [mask-image:radial-gradient(80%_80%_at_50%_50%,white_0%,transparent_100%)]"
            )}
        >
            {children}
        </div>
    );
};

const Container = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                `px-2 py-1 rounded-md text-[10px] flex items-center justify-center bg-[rgba(248,248,248,0.01)]
      shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
      `,
                className
            )}
        >
            {children}
        </div>
    );
};

export const ClaudeLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="geometricPrecision"
            textRendering="geometricPrecision"
            imageRendering="optimizeQuality"
            fillRule="evenodd"
            clipRule="evenodd"
            viewBox="0 0 512 512"
            className={className}
        >
            <rect fill="#CC9B7A" width="512" height="512" rx="104.187" ry="105.042" />
            <path
                fill="#1F1F1E"
                fillRule="nonzero"
                d="M318.663 149.787h-43.368l78.952 212.423 43.368.004-78.952-212.427zm-125.326 0l-78.952 212.427h44.255l15.932-44.608 82.846-.004 16.107 44.612h44.255l-79.126-212.427h-45.317zm-4.251 128.341l26.91-74.701 27.083 74.701h-53.993z"
            />
        </svg>
    );
};

export const OpenAILogo = ({ className }: { className?: string }) => {
    return (
        <svg
            className={className}
            width="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M26.153 11.46a6.888 6.888 0 0 0-.608-5.73 7.117 7.117 0 0 0-3.29-2.93 7.238 7.238 0 0 0-4.41-.454 7.065 7.065 0 0 0-2.41-1.742A7.15 7.15 0 0 0 12.514 0a7.216 7.216 0 0 0-4.217 1.346 7.061 7.061 0 0 0-2.603 3.539 7.12 7.12 0 0 0-2.734 1.188A7.012 7.012 0 0 0 .966 8.268a6.979 6.979 0 0 0 .88 8.273 6.89 6.89 0 0 0 .607 5.729 7.117 7.117 0 0 0 3.29 2.93 7.238 7.238 0 0 0 4.41.454 7.061 7.061 0 0 0 2.409 1.742c.92.404 1.916.61 2.923.604a7.215 7.215 0 0 0 4.22-1.345 7.06 7.06 0 0 0 2.605-3.543 7.116 7.116 0 0 0 2.734-1.187 7.01 7.01 0 0 0 1.993-2.196 6.978 6.978 0 0 0-.884-8.27Zm-10.61 14.71c-1.412 0-2.505-.428-3.46-1.215.043-.023.119-.064.168-.094l5.65-3.22a.911.911 0 0 0 .464-.793v-7.86l2.389 1.36a.087.087 0 0 1 .046.065v6.508c0 2.952-2.491 5.248-5.257 5.248ZM4.062 21.354a5.17 5.17 0 0 1-.635-3.516c.042.025.115.07.168.1l5.65 3.22a.928.928 0 0 0 .928 0l6.898-3.93v2.72a.083.083 0 0 1-.034.072l-5.711 3.255a5.386 5.386 0 0 1-4.035.522 5.315 5.315 0 0 1-3.23-2.443ZM2.573 9.184a5.283 5.283 0 0 1 2.768-2.301V13.515a.895.895 0 0 0 .464.793l6.897 3.93-2.388 1.36a.087.087 0 0 1-.08.008L4.52 16.349a5.262 5.262 0 0 1-2.475-3.185 5.192 5.192 0 0 1 .527-3.98Zm19.623 4.506-6.898-3.93 2.388-1.36a.087.087 0 0 1 .08-.008l5.713 3.255a5.28 5.28 0 0 1 2.054 2.118 5.19 5.19 0 0 1-.488 5.608 5.314 5.314 0 0 1-2.39 1.742v-6.633a.896.896 0 0 0-.459-.792Zm2.377-3.533a7.973 7.973 0 0 0-.168-.099l-5.65-3.22a.93.93 0 0 0-.928 0l-6.898 3.93V8.046a.083.083 0 0 1 .034-.072l5.712-3.251a5.375 5.375 0 0 1 5.698.241 5.262 5.262 0 0 1 1.865 2.28c.39.92.506 1.93.335 2.913ZM9.631 15.009l-2.39-1.36a.083.083 0 0 1-.046-.065V7.075c.001-.997.29-1.973.832-2.814a5.297 5.297 0 0 1 2.231-1.935 5.382 5.382 0 0 1 5.659.72 4.89 4.89 0 0 0-.168.093l-5.65 3.22a.913.913 0 0 0-.465.793l-.003 7.857Zm1.297-2.76L14 10.5l3.072 1.75v3.5L14 17.499l-3.072-1.75v-3.5Z"
                fill="currentColor"
            ></path>
        </svg>
    );
};
export const GeminiLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className={className}
        >
            <path
                d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
                fill="url(#prefix__paint0_radial_980_20147)"
            />
            <defs>
                <radialGradient
                    id="prefix__paint0_radial_980_20147"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"
                >
                    <stop offset=".067" stop-color="#9168C0" />
                    <stop offset=".343" stop-color="#5684D1" />
                    <stop offset=".672" stop-color="#1BA1E3" />
                </radialGradient>
            </defs>
        </svg>
    );
};

export const MetaIconOutline = ({ className }: { className?: string }) => {
    return (
        <svg
            id="Layer_1"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 287.56 191"
            className={className}
        >
            <defs>
                <linearGradient
                    id="linear-gradient"
                    x1="62.34"
                    y1="101.45"
                    x2="260.34"
                    y2="91.45"
                    gradientTransform="matrix(1, 0, 0, -1, 0, 192)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stop-color="#0064e1" />
                    <stop offset="0.4" stop-color="#0064e1" />
                    <stop offset="0.83" stop-color="#0073ee" />
                    <stop offset="1" stop-color="#0082fb" />
                </linearGradient>
                <linearGradient
                    id="linear-gradient-2"
                    x1="41.42"
                    y1="53"
                    x2="41.42"
                    y2="126"
                    gradientTransform="matrix(1, 0, 0, -1, 0, 192)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stop-color="#0082fb" />
                    <stop offset="1" stop-color="#0064e0" />
                </linearGradient>
            </defs>
            <path
                fill="#0081fb"
                d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"
            />
            <path
                fill="url(#linear-gradient)"
                d="M24.49,37.3C38.73,15.35,59.28,0,82.85,0c13.65,0,27.22,4,41.39,15.61,15.5,12.65,32,33.48,52.63,67.81l7.39,12.32c17.84,29.72,28,45,33.93,52.22,7.64,9.26,13,12,19.94,12,17.63,0,22-16.2,22-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191c-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71L146.08,93.6c-12.94-21.62-24.81-37.74-31.68-45C107,40.71,97.51,31.23,82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78Z"
            />
            <path
                fill="url(#linear-gradient-2)"
                d="M82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78C38.61,71.62,31.06,99.34,31.06,126c0,11,2.41,19.41,5.56,24.51L10.14,167.91C3.34,156.6,0,141.76,0,124.85,0,94.1,8.44,62.05,24.49,37.3,38.73,15.35,59.28,0,82.85,0Z"
            />
        </svg>
    );
};