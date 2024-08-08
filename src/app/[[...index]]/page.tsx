"use client"

import { Flow } from '@/components/flow';
import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

const initialNodes = [
  {
    id: `question_${nanoid()}`,
    type: "question",
    data: {
      question: faker.lorem.sentence(),
      description: faker.lorem.sentence(),
      options: Array.from({ length: faker.number.int({ min: 1, max: 6 }) }).map(() => ({
        id: `answer_${nanoid()}`,
        text: faker.lorem.words({ min: 1, max: 5 }),
        nextNodeId: null
      }))
    },
    position: { x: 0, y: 0 },
  }
];

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [data, setData] = useState({ nodes: [], edges: [] })

  useEffect(() => {
    if (typeof window !== undefined) {
      const data = window.localStorage.getItem("flowcala")

      if (data) {
        try {
          setData(JSON.parse(data))
        } catch (error) {
          return
        }
      } else {
        setData({
          nodes: initialNodes,
          edges: []
        })
      }

      setIsLoaded(true)
    }
  }, [])


  if (!isLoaded) return null

  return (
    <div className="bg-background sm:p-4 h-svh">
      <Flow className="sm:border sm:rounded-md" initialNodes={data.nodes} initialEdges={data.edges} />
      <Toaster
        toastOptions={{
          classNames: {
            toast: 'max-w-xs bg-background shadow-none border-border text-muted-foreground right-0',
          },
        }}
      />
    </div>
  );
}