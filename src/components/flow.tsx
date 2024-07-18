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
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import MessageNode from './message-node';
import QuestionNode from './question-node';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent } from './ui/popover';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const nodeTypes = {
    question: QuestionNode,
    message: MessageNode
};

const HORIZONTAL_SPACING = 375; // Adjust this value as needed

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
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
    );

    const [direction, setDirection] = useState<"TB" | "LR">("TB")

    const connectingNodeId = useRef(null);
    const nameRef = useRef<HTMLInputElement | null>(null)

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

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
        // @ts-ignore
        (event) => {
            const connecting = connectingNodeId.current;
            if (!connecting) return;

            const targetIsPane = event.target.classList.contains('react-flow__pane');

            if (targetIsPane) {
                const id = nanoid();
                const existingNodes = getNodes();
                const lastNode = existingNodes[existingNodes.length - 1];
                const newNodeX = lastNode ? lastNode.position.x + HORIZONTAL_SPACING : HORIZONTAL_SPACING;

                const newNode = {
                    id,
                    // position: {
                    //     x: newNodeX,
                    //     y: 0,
                    // },
                    position: screenToFlowPosition({
                        x: event.clientX + 200,
                        y: event.clientY,
                    }),
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
                    // @ts-ignore
                    const sourceNode = updatedNodes.find(node => node.id === connecting.nodeId);
                    if (sourceNode) {
                        // @ts-ignore
                        sourceNode.data.options = sourceNode.data.options.map(opt =>
                            // @ts-ignore
                            opt.id === connecting.handleId ? { ...opt, nextNodeId: id } : opt
                        );
                    }
                    return updatedNodes;
                });

                const newEdge: Edge = {
                    // @ts-ignore
                    id: `e${connecting.handleId}-${id}`,
                    // @ts-ignore
                    source: connecting.nodeId,
                    // @ts-ignore
                    sourceHandle: connecting.handleId,
                    target: id,
                    animated: true,
                    type: ConnectionLineType.SmoothStep
                };

                setEdges((eds) => eds.concat(newEdge));

                // Center the view on the new node
                setTimeout(() => {
                    setCenter(newNodeX, 0, { zoom: getViewport().zoom, duration: 1000 });
                }, 100);
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

            const newNodeX = lastNode ? lastNode.position.x + HORIZONTAL_SPACING : HORIZONTAL_SPACING;

            const newNode = {
                id: newNodeId,
                type: 'question',
                position: {
                    x: newNodeX,
                    y: 0
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
                setCenter(newNodeX, 0, { zoom: viewport.zoom, duration: 1000 });
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

            const newNodeX = lastNode ? lastNode.position.x + HORIZONTAL_SPACING : HORIZONTAL_SPACING;

            const newNode = {
                id: newNodeId,
                type: "message",
                position: {
                    x: newNodeX,
                    y: 0
                },
                data: {
                    heading: "Thank you for registering",
                    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, eos!"
                }
            };

            const updatedNodes = [...nds, newNode];

            // Center the view on the new node
            setTimeout(() => {
                setCenter(newNodeX, 0, { zoom: viewport.zoom, duration: 1000 });
            }, 100);

            return updatedNodes;
        });

        // Connect unconnected question node options to the new Final Node
        setEdges((eds) => {
            const nodes = getNodes();
            // @ts-ignore
            const newEdges = [];

            nodes.forEach(node => {
                if (node.type === 'question') {
                    // @ts-ignore
                    node.data.options.forEach(option => {
                        console.log(option)
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

            // @ts-ignore
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

    return (
        <DirectionContext.Provider value={{ direction }}>
            <ReactFlow
                className="bg-background h-full w-full"
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
                <Background className="dark:opacity-50" />
                <Controls />
                <Panel position="top-left">
                    <Tabs value={direction} onValueChange={value => {
                        onLayout(value)
                        setDirection(value as "TB" | "LR")
                    }}>
                        <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-0">
                            <TabsTrigger className="h-9 w-9" value="TB">
                                <FoldHorizontal className="w-3.5 h-3.5" />
                            </TabsTrigger>
                            <TabsTrigger className="h-9 w-9" value="LR">
                                <FoldVertical className="w-3.5 h-3.5" />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </Panel>
                <Panel className="max-w-md w-full" position="top-center">
                    <div className="relative h-9 shadow rounded-md bg-muted/30 backdrop-blur-sm items-center border hover:border-foreground/30 flex text-muted-foreground hover:text-foreground transition-colors pr-px">
                        <Input placeholder="6-8 questions, dentist, new client onboarding" className="placeholder:opacity-50 text-foreground flex-1 focus-visible:ring-transparent border-none bg-transparent" />
                        <Button>
                            Generate <WandSparkles className="h-3.5 w-3.5 ml-2" />
                        </Button>
                    </div>
                </Panel>
                <Panel className="space-x-2" position="bottom-center">
                    <Button onClick={addNewQuestion}>Add Node</Button>
                    <Button variant="ghost" onClick={addFinalNode}>Final Node</Button>
                </Panel>
                <Panel position="top-right">
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
                </Panel>
            </ReactFlow >
        </DirectionContext.Provider>
    );
};

const DirectionContext = createContext<{ direction: "TB" | "LR" }>(null)

export function useDirection() {
    const context = useContext(DirectionContext)
    if (!context) throw new Error("useDirection must be used within DirectionContext.Provider")
    return context
}