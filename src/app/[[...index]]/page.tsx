"use client"

import { Flow } from '@/components/flow';
import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react';

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
    <div className="bg-muted/30 sm:p-4 h-full">
      <Flow className="sm:border sm:rounded-md" initialNodes={data.nodes} initialEdges={data.edges} />
    </div>
  );
}



// const data = {
//   "name": "Male Skin Care Questionnaire",
//   "map": {
//     "nodes": [
//       {
//         "id": "age",
//         "type": "question",
//         "position": { "x": 0, "y": 0 },
//         "data": {
//           "question": "What is your age range?",
//           "options": [
//             { "id": "age_18_24", "text": "18-24", "nextNodeId": "skin_type" },
//             { "id": "age_25_34", "text": "25-34", "nextNodeId": "skin_type" },
//             { "id": "age_35_44", "text": "35-44", "nextNodeId": "skin_type" },
//             { "id": "age_45_plus", "text": "45+", "nextNodeId": "skin_type" }
//           ]
//         }
//       },
//       {
//         "id": "skin_type",
//         "type": "question",
//         "position": { "x": 0, "y": 100 },
//         "data": {
//           "question": "How would you describe your skin type?",
//           "options": [
//             { "id": "skin_oily", "text": "Oily", "nextNodeId": "acne_prone" },
//             { "id": "skin_dry", "text": "Dry", "nextNodeId": "sensitivity" },
//             { "id": "skin_combination", "text": "Combination", "nextNodeId": "acne_prone" },
//             { "id": "skin_normal", "text": "Normal", "nextNodeId": "sun_exposure" }
//           ]
//         }
//       },
//       {
//         "id": "acne_prone",
//         "type": "question",
//         "position": { "x": -200, "y": 200 },
//         "data": {
//           "question": "Do you have acne-prone skin?",
//           "options": [
//             { "id": "acne_yes", "text": "Yes", "nextNodeId": "acne_severity" },
//             { "id": "acne_no", "text": "No", "nextNodeId": "sun_exposure" }
//           ]
//         }
//       },
//       {
//         "id": "sensitivity",
//         "type": "question",
//         "position": { "x": 200, "y": 200 },
//         "data": {
//           "question": "Is your skin sensitive?",
//           "options": [
//             { "id": "sensitivity_yes", "text": "Yes", "nextNodeId": "sun_exposure" },
//             { "id": "sensitivity_no", "text": "No", "nextNodeId": "sun_exposure" }
//           ]
//         }
//       },
//       {
//         "id": "acne_severity",
//         "type": "question",
//         "position": { "x": -400, "y": 300 },
//         "data": {
//           "question": "How would you rate your acne severity?",
//           "options": [
//             { "id": "acne_mild", "text": "Mild", "nextNodeId": "sun_exposure" },
//             { "id": "acne_moderate", "text": "Moderate", "nextNodeId": "sun_exposure" },
//             { "id": "acne_severe", "text": "Severe", "nextNodeId": "dermatologist" }
//           ]
//         }
//       },
//       {
//         "id": "dermatologist",
//         "type": "question",
//         "position": { "x": -600, "y": 400 },
//         "data": {
//           "question": "Have you consulted a dermatologist for your acne?",
//           "options": [
//             { "id": "derm_yes", "text": "Yes", "nextNodeId": "sun_exposure" },
//             { "id": "derm_no", "text": "No", "nextNodeId": "derm_recommend" }
//           ]
//         }
//       },
//       {
//         "id": "derm_recommend",
//         "type": "message",
//         "position": { "x": -800, "y": 500 },
//         "data": {
//           "heading": "Dermatologist Recommendation",
//           "description": "We recommend consulting a dermatologist for your severe acne. They can provide professional advice and treatment options."
//         }
//       },
//       {
//         "id": "sun_exposure",
//         "type": "question",
//         "position": { "x": 0, "y": 500 },
//         "data": {
//           "question": "How much sun exposure do you get daily?",
//           "options": [
//             { "id": "sun_minimal", "text": "Minimal (mostly indoors)", "nextNodeId": "shaving_frequency" },
//             { "id": "sun_moderate", "text": "Moderate (1-3 hours outside)", "nextNodeId": "shaving_frequency" },
//             { "id": "sun_high", "text": "High (3+ hours outside)", "nextNodeId": "sunscreen_use" }
//           ]
//         }
//       },
//       {
//         "id": "sunscreen_use",
//         "type": "question",
//         "position": { "x": 200, "y": 600 },
//         "data": {
//           "question": "Do you use sunscreen daily?",
//           "options": [
//             { "id": "sunscreen_yes", "text": "Yes", "nextNodeId": "shaving_frequency" },
//             { "id": "sunscreen_no", "text": "No", "nextNodeId": "sunscreen_education" }
//           ]
//         }
//       },
//       {
//         "id": "sunscreen_education",
//         "type": "message",
//         "position": { "x": 400, "y": 700 },
//         "data": {
//           "heading": "Sunscreen Education",
//           "description": "Daily sunscreen use is crucial for skin health and preventing premature aging. We recommend incorporating a broad-spectrum SPF 30+ into your daily routine."
//         }
//       },
//       {
//         "id": "shaving_frequency",
//         "type": "question",
//         "position": { "x": 0, "y": 700 },
//         "data": {
//           "question": "How often do you shave?",
//           "options": [
//             { "id": "shave_daily", "text": "Daily", "nextNodeId": "razor_type" },
//             { "id": "shave_few_times", "text": "Few times a week", "nextNodeId": "razor_type" },
//             { "id": "shave_weekly", "text": "Weekly or less", "nextNodeId": "beard_care" }
//           ]
//         }
//       },
//       {
//         "id": "razor_type",
//         "type": "question",
//         "position": { "x": -200, "y": 800 },
//         "data": {
//           "question": "What type of razor do you use?",
//           "options": [
//             { "id": "razor_disposable", "text": "Disposable razor", "nextNodeId": "skincare_routine" },
//             { "id": "razor_cartridge", "text": "Cartridge razor", "nextNodeId": "skincare_routine" },
//             { "id": "razor_safety", "text": "Safety razor", "nextNodeId": "skincare_routine" },
//             { "id": "razor_electric", "text": "Electric shaver", "nextNodeId": "skincare_routine" }
//           ]
//         }
//       },
//       {
//         "id": "beard_care",
//         "type": "question",
//         "position": { "x": 200, "y": 800 },
//         "data": {
//           "question": "Do you use any beard care products?",
//           "options": [
//             { "id": "beard_yes", "text": "Yes", "nextNodeId": "skincare_routine" },
//             { "id": "beard_no", "text": "No", "nextNodeId": "skincare_routine" }
//           ]
//         }
//       },
//       {
//         "id": "skincare_routine",
//         "type": "question",
//         "position": { "x": 0, "y": 900 },
//         "data": {
//           "question": "Do you currently have a skincare routine?",
//           "options": [
//             { "id": "routine_yes", "text": "Yes", "nextNodeId": "routine_frequency" },
//             { "id": "routine_no", "text": "No", "nextNodeId": "skincare_concerns" }
//           ]
//         }
//       },
//       {
//         "id": "routine_frequency",
//         "type": "question",
//         "position": { "x": -200, "y": 1000 },
//         "data": {
//           "question": "How often do you follow your skincare routine?",
//           "options": [
//             { "id": "routine_daily", "text": "Daily", "nextNodeId": "skincare_concerns" },
//             { "id": "routine_sometimes", "text": "A few times a week", "nextNodeId": "skincare_concerns" },
//             { "id": "routine_rarely", "text": "Rarely", "nextNodeId": "skincare_concerns" }
//           ]
//         }
//       },
//       {
//         "id": "skincare_concerns",
//         "type": "question",
//         "position": { "x": 0, "y": 1100 },
//         "data": {
//           "question": "What are your main skincare concerns? (Select all that apply)",
//           "options": [
//             { "id": "concern_acne", "text": "Acne/Breakouts", "nextNodeId": "budget" },
//             { "id": "concern_aging", "text": "Aging/Fine lines", "nextNodeId": "budget" },
//             { "id": "concern_dryness", "text": "Dryness", "nextNodeId": "budget" },
//             { "id": "concern_oiliness", "text": "Oiliness", "nextNodeId": "budget" },
//             { "id": "concern_uneven", "text": "Uneven skin tone", "nextNodeId": "budget" }
//           ]
//         }
//       },
//       {
//         "id": "budget",
//         "type": "question",
//         "position": { "x": 0, "y": 1200 },
//         "data": {
//           "question": "What's your budget for skincare products?",
//           "options": [
//             { "id": "budget_low", "text": "Under $50/month", "nextNodeId": "result" },
//             { "id": "budget_medium", "text": "$50-$100/month", "nextNodeId": "result" },
//             { "id": "budget_high", "text": "Over $100/month", "nextNodeId": "result" }
//           ]
//         }
//       },
//       {
//         "id": "result",
//         "type": "message",
//         "position": { "x": 0, "y": 1300 },
//         "data": {
//           "heading": "Your Personalized Skincare Recommendation",
//           "description": "Based on your responses, we've curated a personalized skincare routine tailored to your skin type, concerns, and lifestyle. Check your email for your custom product recommendations and care instructions."
//         }
//       }
//     ],
//     "edges": [
//       { "id": "age_to_skin", "source": "age", "target": "skin_type", "sourceHandle": "age_18_24", "animated": true, "type": "smoothstep" },
//       { "id": "skin_to_acne", "source": "skin_type", "target": "acne_prone", "sourceHandle": "skin_oily", "animated": true, "type": "smoothstep" },
//       { "id": "skin_to_sensitivity", "source": "skin_type", "target": "sensitivity", "sourceHandle": "skin_dry", "animated": true, "type": "smoothstep" },
//       { "id": "acne_to_severity", "source": "acne_prone", "target": "acne_severity", "sourceHandle": "acne_yes", "animated": true, "type": "smoothstep" },
//       { "id": "acne_to_sun", "source": "acne_prone", "target": "sun_exposure", "sourceHandle": "acne_no", "animated": true, "type": "smoothstep" },
//       { "id": "severity_to_derm", "source": "acne_severity", "target": "dermatologist", "sourceHandle": "acne_severe", "animated": true, "type": "smoothstep" },
//       { "id": "sensitivity_to_sun", "source": "sensitivity", "target": "sun_exposure", "sourceHandle": "sensitivity_yes", "animated": true, "type": "smoothstep" },
//       { "id": "sun_to_sunscreen", "source": "sun_exposure", "target": "sunscreen_use", "sourceHandle": "sun_high", "animated": true, "type": "smoothstep" },
//       { "id": "sun_to_shaving", "source": "sun_exposure", "target": "shaving_frequency", "sourceHandle": "sun_minimal", "animated": true, "type": "smoothstep" },
//       { "id": "sunscreen_to_education", "source": "sunscreen_use", "target": "sunscreen_education", "sourceHandle": "sunscreen_no", "animated": true, "type": "smoothstep" },
//       { "id": "shaving_to_razor", "source": "shaving_frequency", "target": "razor_type", "sourceHandle": "shave_daily", "animated": true, "type": "smoothstep" },
//       { "id": "shaving_to_beard", "source": "shaving_frequency", "target": "beard_care", "sourceHandle": "shave_weekly", "animated": true, "type": "smoothstep" },
//       { "id": "razor_to_routine", "source": "razor_type", "target": "skincare_routine", "sourceHandle": "razor_disposable", "animated": true, "type": "smoothstep" },
//       { "id": "beard_to_routine", "source": "beard_care", "target": "skincare_routine", "sourceHandle": "beard_yes", "animated": true, "type": "smoothstep" },
//       { "id": "routine_to_frequency", "source": "skincare_routine", "target": "routine_frequency", "sourceHandle": "routine_yes", "animated": true, "type": "smoothstep" },
//       { "id": "routine_to_concerns", "source": "skincare_routine", "target": "skincare_concerns", "sourceHandle": "routine_no", "animated": true, "type": "smoothstep" },
//       { "id": "frequency_to_concerns", "source": "routine_frequency", "target": "skincare_concerns", "sourceHandle": "routine_daily", "animated": true, "type": "smoothstep" },
//       { "id": "concerns_to_budget", "source": "skincare_concerns", "target": "budget", "sourceHandle": "concern_acne", "animated": true, "type": "smoothstep" },
//       { "id": "budget_to_result", "source": "budget", "target": "result", "sourceHandle": "budget_low", "animated": true, "type": "smoothstep" },
//       { "id": "derm_to_sun", "source": "dermatologist", "target": "sun_exposure", "sourceHandle": "derm_yes", "animated": true, "type": "smoothstep" },
//       { "id": "derm_to_recommend", "source": "dermatologist", "target": "derm_recommend", "sourceHandle": "derm_no", "animated": true, "type": "smoothstep" },
//       { "id": "sunscreen_edu_to_shaving", "source": "sunscreen_education", "target": "shaving_frequency", "animated": true, "type": "smoothstep" }
//     ]
//   }
// }