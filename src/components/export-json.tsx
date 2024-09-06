import { Edge, Node, useStore } from '@xyflow/react';
import React from 'react';

export const ExportButton = () => {
    const edges = useStore((store) => store.edges);
    const nodes = useStore((store) => store.nodes);

    const handleExport = () => {
        // Create a JSON object with nodes and edges
        const graphData = {
            nodes: nodes,
            edges: edges
        };

        // Convert the object to a JSON string
        const jsonString = JSON.stringify(graphData, null, 2);

        // Create a Blob with the JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a temporary URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'graph_data.json';
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
            Export Graph
        </button>
    );
};
