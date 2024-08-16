import { memo } from 'react';
import { motion } from 'framer-motion'

function AnnotationNode({ data }) {
    return (
        <motion.div
            key={data.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <div className="p-2.5 flex w-64 font-mono">
                <div className="mr-1">{data.level}.</div>
                <div className="text-balance">{data.label}</div>
            </div>
            {data.arrowStyle && (
                <div className="h-4 w-4 text-2xl" style={data.arrowStyle}>
                    ⤹
                </div>
            )}
        </motion.div>
    );
}

export default memo(AnnotationNode);