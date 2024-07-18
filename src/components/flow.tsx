"use client"

import { faker } from '@faker-js/faker';
import { PopoverClose, PopoverTrigger } from '@radix-ui/react-popover';
import { useMutation } from '@tanstack/react-query';
import {
    addEdge,
    Background,
    ConnectionLineType,
    Controls,
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
import { FoldHorizontal, FoldVertical, Loader2, UploadCloud, WandSparkles } from "lucide-react";
import { nanoid } from 'nanoid';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import MessageNode from './message-node';
import QuestionNode from './question-node';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent } from './ui/popover';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignIn, useUser } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';

const nodeTypes = {
    question: QuestionNode,
    message: MessageNode
};

const HORIZONTAL_SPACING = 375; // Adjust this value as needed
const VERTICAL_SPACING = 200; // Adjust this value as needed

const dagreGraph = new dagre.graphlib.Graph();

dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320;
const nodeHeight = 110;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode = {
            ...node,
            direction,
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };

        return newNode;
    });

    return { nodes: newNodes, edges };
};

export const Flow = ({ initialNodes, initialEdges }: { initialNodes: Node[], initialEdges: Edge[] }) => {
    const { isSignedIn } = useUser()

    const params = useSearchParams()

    // const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    //     initialNodes,
    //     initialEdges,
    // );

    const [direction, setDirection] = useState<"TB" | "LR">("LR")

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
                const id = nanoid();
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
                            id: nanoid(),
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
        const newNodeId = nanoid();

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
                            id: nanoid(),
                            text: 'Option 1',
                            nextNodeId: null
                        },
                        {
                            id: nanoid(),
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
        const newNodeId = nanoid();

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
            router.push(`/${data.id}`)
        },
    })

    const onLayout = useCallback(
        (direction) => {
            const { nodes: layoutedNodes, edges: layoutedEdges } =
                getLayoutedElements(nodes, edges, direction);

            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        },
        [nodes, edges],
    );

    const handleLocalPublish = () => {
        localStorage.setItem("flowcala", JSON.stringify({
            nodes,
            edges
        }))

        router.push("/?dialog=auth")
    }

    return (
        <DirectionContext.Provider value={{ direction }}>
            <ReactFlow
                className="bg-background h-full w-full relative"
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                minZoom={0.1}
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
            >
                <div className='[mask-image:radial-gradient(55vw_circle_at_50%,white,transparent)] pointer-events-none absolute inset-0 h-full w-full'>
                    <Background className="dark:opacity-70" />
                </div>
                <Controls />
                <Panel position="top-left">
                    <Tabs value={direction} onValueChange={value => {
                        onLayout(value)
                        setDirection(value as "TB" | "LR")
                    }}>
                        <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-0">
                            <TabsTrigger className="h-9 w-9" value="LR">
                                <FoldHorizontal className="w-3.5 h-3.5" />
                            </TabsTrigger>
                            <TabsTrigger disabled className="h-9 w-9" value="TB">
                                <FoldVertical className="w-3.5 h-3.5" />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </Panel>
                <Panel className="max-w-md w-full" position="top-center">
                    <div className="cursor-not-allowed relative h-9 shadow rounded-md bg-muted/30 backdrop-blur-sm items-center border !hover:border-foreground/30 flex text-muted-foreground hover:text-foreground transition-colors pr-px">
                        <Input disabled placeholder="6-8 questions, dentist, new client onboarding" className="placeholder:opacity-50 text-foreground flex-1 focus-visible:ring-transparent border-none bg-transparent" />
                        <Button disabled>
                            Generate ✨
                        </Button>
                        <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 bg-muted/30 backdrop-blur-sm border text-[11px] px-1 text-muted-foreground/50 rounded-md">Coming soon 🎉</div>
                    </div>
                </Panel>
                <Panel className="space-x-2" position="bottom-center">
                    <Button onClick={addNewQuestion}>Add Node</Button>
                    <Button variant="ghost" onClick={addFinalNode}>Final Node</Button>
                </Panel>
                <Panel position="top-right">
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
                            <PopoverContent align="end">
                                <form onSubmit={event => {
                                    event.preventDefault()
                                    mutation.mutate()
                                }} className="space-y-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <Input disabled={mutation.isPending} ref={nameRef} placeholder="website.com" />
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
            </ReactFlow>
            <Dialog
                open={params.get("dialog") === "auth"}
                onOpenChange={(value) => {
                    if (!value) {
                        // Create a new URLSearchParams object
                        const newSearchParams = new URLSearchParams(params);
                        // Remove the "dialog" parameter
                        newSearchParams.delete("dialog");
                        // Construct the new URL
                        const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;
                        // Use router.push to update the URL without the dialog parameter
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
        </DirectionContext.Provider>
    );
};

const DirectionContext = createContext<{ direction: "TB" | "LR" }>(null)

export function useDirection() {
    const context = useContext(DirectionContext)
    if (!context) throw new Error("useDirection must be used within DirectionContext.Provider")
    return context
}