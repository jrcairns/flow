"use client"

import { faker } from '@faker-js/faker';
import {
    addEdge,
    Background,
    ColorMode,
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
import { useCallback, useRef, useState } from 'react';
import { nanoid } from 'nanoid'
import QuestionNode from './question-node';
import { Button } from './ui/button';
import MessageNode from './message-node';
import { Cloud, CloudCog, Upload, UploadCloud } from "lucide-react"
import { useRouter } from 'next/navigation';

const nodeTypes = {
    question: QuestionNode,
    message: MessageNode
};

const HORIZONTAL_SPACING = 375; // Adjust this value as needed

export const Flow = ({ initialNodes, initialEdges }: { initialNodes: Node[], initialEdges: Edge[] }) => {
    const [colorMode, setColorMode] = useState<ColorMode>('dark');
    const connectingNodeId = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition, setCenter, getNodes, getViewport } = useReactFlow();
    const router = useRouter()

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
                    const sourceNode = updatedNodes.find(node => node.id === connecting.nodeId);
                    if (sourceNode) {
                        sourceNode.data.options = sourceNode.data.options.map(opt =>
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

        // Connect unconnected question node options to the new final node
        setEdges((eds) => {
            const nodes = getNodes();
            const newEdges = [];

            nodes.forEach(node => {
                if (node.type === 'question') {
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

            return [...eds, ...newEdges];
        });

    }, [setNodes, getNodes, setCenter, getViewport, setEdges]);

    const handlePublish = async () => {
        const payload = {
            name: "Test Project 1",
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

        router.push(`/${data.id}`)
    }

    return (
        <ReactFlow
            className="bg-background h-full w-full"
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            colorMode={colorMode}
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
            <Background className="opacity-50" />
            <Controls />
            <Panel className="space-x-2" position="bottom-center">
                <Button onClick={addNewQuestion}>Add node</Button>
                <Button variant="ghost" onClick={addFinalNode}>Final node</Button>
            </Panel>
            <Panel position="top-right">
                <Button onClick={handlePublish}>
                    Publish
                    <UploadCloud className="ml-2 h-3.5 w-3.5" />
                </Button>
            </Panel>
        </ReactFlow>
    );
};