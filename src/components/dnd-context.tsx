"use client"
import { createContext, useContext, useState } from 'react';

const DnDContext = createContext([null, (_) => { }]);

export function DnDProvider({ children }) {
    const [type, setType] = useState(null);

    return (
        <DnDContext.Provider value={[type, setType]}>
            {children}
        </DnDContext.Provider>
    );
}

export default DnDContext;

export function useDnD() {
    return useContext(DnDContext);
}