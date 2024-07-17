import { Flow } from '@/components/flow';
import { faker } from '@faker-js/faker';
import { nanoid } from 'nanoid'

const initialNodes = [
  {
    id: nanoid(),
    type: "question",
    data: {
      question: faker.lorem.sentences(),
      options: Array.from({ length: faker.number.int({ min: 1, max: 6 }) }).map(() => ({
        id: nanoid(),
        text: faker.lorem.words({ min: 1, max: 5 }),
        nextNodeId: null
      }))
    },
    position: { x: 0, y: 0 },
  }
];

export default function Home() {
  return (
    <div className="h-screen">
      <Flow initialNodes={initialNodes} initialEdges={[]} />
    </div>
  );
}
