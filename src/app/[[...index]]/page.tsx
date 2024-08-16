"use client"

import { Flow } from '@/components/flow';
import { faker } from '@faker-js/faker';
import { Node } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

const initialNodes: Node[] = [
  {
    id: 'annotation-1',
    type: 'annotation',
    draggable: false,
    selectable: false,
    data: {
      level: 1,
      label:
        "Customize your landing page copy.",
      arrowStyle: {
        right: 32,
        bottom: -24,
        position: "absolute",
        transform: 'rotate(-80deg)',
      },
    },
    position: { x: -250, y: -100 },
  },
  {
    id: "get-started",
    type: "start",
    draggable: false,
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
  },
  {
    id: 'annotation-2',
    type: 'annotation',
    draggable: false,
    selectable: false,
    data: {
      level: 2,
      label:
        "Let AI help you generate a starting off point.",
      arrowStyle: {
        left: 24,
        bottom: -24,
        position: "absolute",
        transform: 'scaleX(-1) rotate(-60deg)',
      },
    },
    position: { x: 500, y: 275 },
  },
  {
    id: "generate-quiz",
    type: "generate",
    draggable: false,
    data: {
      question: faker.lorem.sentence(),
      description: faker.lorem.sentence(),
      options: Array.from({ length: faker.number.int({ min: 1, max: 6 }) }).map(() => ({
        id: `answer_${nanoid()}`,
        text: faker.lorem.words({ min: 1, max: 5 }),
        nextNodeId: null
      }))
    },
    position: { x: 0, y: 375 },
  },
  {
    id: 'annotation-3',
    type: 'annotation',
    hidden: true,
    draggable: false,
    selectable: false,
    data: {
      level: 3,
      label:
        "Configure your quiz questions and answers.",
      arrowStyle: {
        right: 0,
        bottom: -24,
        position: "absolute",
        transform: 'rotate(-80deg)',
      },
    },
    position: { x: -280, y: 475 },
  },
  // {
  //   id: `question_${nanoid()}`,
  //   type: "question",
  //   data: {
  //     question: faker.lorem.sentence(),
  //     description: faker.lorem.sentence(),
  //     options: Array.from({ length: faker.number.int({ min: 1, max: 6 }) }).map(() => ({
  //       id: `answer_${nanoid()}`,
  //       text: faker.lorem.words({ min: 1, max: 5 }),
  //       nextNodeId: null
  //     }))
  //   },
  //   position: { x: 0, y: 0 },
  // },
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