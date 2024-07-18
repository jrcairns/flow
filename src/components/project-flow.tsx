"use client"

import { faker } from '@faker-js/faker';
import {
    addEdge,
    Background,
    ColorMode,
    ConnectionLineType,
    Controls,
    Edge,
    Panel,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Code } from "lucide-react";
import { nanoid } from 'nanoid';
import { createContext, useCallback, useRef, useState } from 'react';
import MessageNode from './message-node';
import QuestionNode from './question-node';
import { Button } from './ui/button';
import { useMutation } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const nodeTypes = {
    question: QuestionNode,
    message: MessageNode
};

const HORIZONTAL_SPACING = 375;

export const ProjectFlow = ({ project }: { project: any }) => {
    const [direction, setDirection] = useState<"TB" | "LR">("TB")
    const connectingNodeId = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(project.map.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(project.map.edges);
    const { screenToFlowPosition, setCenter, getNodes, getViewport } = useReactFlow();

    // @ts-ignore
    const onConnect = useCallback((connection) => {
        if (connection.source && connection.target && connection.sourceHandle) {
            setNodes((nds) => {
                return nds.map((node) => {
                    if (node.id === connection.source) {// @ts-ignore
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
            };

            setEdges((eds) => addEdge(newEdge, eds));
        }
    }, [setNodes, setEdges]);
    // @ts-ignore
    const onConnectStart = useCallback((_, props) => {// @ts-ignore
        connectingNodeId.current = {
            nodeId: props.nodeId,
            handleId: props.handleId
        };
    }, []);

    const onConnectEnd = useCallback(// @ts-ignore
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
                    const updatedNodes = nds.concat(newNode);// @ts-ignore
                    const sourceNode = updatedNodes.find(node => node.id === connecting.nodeId);
                    if (sourceNode) {// @ts-ignore
                        sourceNode.data.options = sourceNode.data.options.map(opt =>// @ts-ignore
                            opt.id === connecting.handleId ? { ...opt, nextNodeId: id } : opt
                        );
                    }
                    return updatedNodes;
                });

                const newEdge: Edge = {// @ts-ignore
                    id: `e${connecting.handleId}-${id}`,// @ts-ignore
                    source: connecting.nodeId,// @ts-ignore
                    sourceHandle: connecting.handleId,
                    target: id,
                    animated: true,
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
            const nodes = getNodes();// @ts-ignore
            const newEdges = [];

            nodes.forEach(node => {
                if (node.type === 'question') {// @ts-ignore
                    node.data.options.forEach(option => {
                        // Check if this option doesn't have a next node or if its next node doesn't exist
                        const nextNodeExists = nodes.some(n => n.id === option.nextNodeId);
                        if (!option.nextNodeId || !nextNodeExists) {
                            newEdges.push({
                                id: `e${node.id}-${option.id}-${newNodeId}`,
                                source: node.id,
                                sourceHandle: option.id,
                                target: newNodeId,
                                animated: true
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
                map: {
                    nodes, edges
                }
            }
            await fetch(`/api/project/${project.id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json"
                }
            })
            return true;
        }
    })

    return (
        <DirectionContext.Provider value={{ direction }}>
            <ReactFlow
                className="bg-muted/30 h-full w-full"
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
                snapToGrid
                connectionLineType={ConnectionLineType.Bezier}
                defaultViewport={{ x: 200, y: 200, zoom: 1 }}
            >
                <Background className="dark:opacity-50" />
                <Controls />
                <Panel className="space-x-2" position="top-left">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button>View Code</Button>
                        </SheetTrigger>
                        <SheetContent>
                        </SheetContent>
                    </Sheet>
                </Panel>
                <Panel className="space-x-2" position="bottom-center">
                    <Button onClick={addNewQuestion}>Add Node</Button>
                    <Button variant="ghost" onClick={addFinalNode}>Final Node</Button>
                </Panel>
                <Panel className="space-x-2" position="top-right">
                    <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
                </Panel>
            </ReactFlow>
        </DirectionContext.Provider>
    );
}


const DirectionContext = createContext<{ direction: "TB" | "LR" }>(null)