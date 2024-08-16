import React from 'react';
import { useDnD } from './dnd-context';
import { MacFrame } from './mac-frame';

export default () => {
    const [_, setType] = useDnD();

    const onDragStart = (event, nodeType) => {
        setType(nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside>
            {/* <div className="description">You can drag these nodes to the pane on the right.</div> */}
            <div className="dndnode" onDragStart={(event) => onDragStart(event, 'question')} draggable>
                <MacFrame className="rounded-md relative border bg-background shadow group w-[500px]">
                    <div className="p-6 flex flex-col justify-center text-center">
                        <span className="text-[1.1875rem] leading-7 tracking-[0.003125rem]">Lorem, ipsum dolor.</span>
                        <span className="text-muted-foreground text-sm">Lorem ipsum dolor sit amet consectetur adipisicing elit.</span>
                    </div>
                </MacFrame>
            </div>
            {/* <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default')} draggable>
                Default Node
            </div>
            <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'output')} draggable>
                Output Node
            </div> */}
        </aside>
    );
};