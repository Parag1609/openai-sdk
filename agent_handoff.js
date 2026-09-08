import 'dotenv/config';
import { Agent,tool,run } from '@openai/agents';
import {z} from 'zod';
import {RECOMMENDED_PROMPT_PREFIX} from '@openai/agents-core/extensions'
import fs from 'node:fs/promises';

const fetchAvailablePlans = tool({
    name: 'fetch_available_plans',
    description: 'Fetch the available plans for internt',
    parameters: z.object({}),
    execute: async function(){
        return [{plan_id:'1',price_inr:399, speed:'20mbps'},
            {plan_id:'2',price_inr:499, speed:'50mbps'},
            {plan_id:'3',price_inr:599, speed:'100mbps'},
            {plan_id:'4',price_inr:699, speed:'200mbps'},
            {plan_id:'5',price_inr:799, speed:'300mbps'},
            {plan_id:'6',price_inr:899, speed:'400mbps'},
            {plan_id:'7',price_inr:999, speed:'500mbps'},
            {plan_id:'8',price_inr:1099, speed:'600mbps'},
            {plan_id:'9',price_inr:1199, speed:'700mbps'},
            {plan_id:'10',price_inr:1299, speed:'800mbps'},
        ]
    }

})
const processRefund = tool({
    name:'process_refund',
    description: `this tool processes the refund for a customer`,
    parameters: z.object({
        customerId: z.string().describe('id of the customer'),
        reason: z.string().describe('reason for refund'),
    }),
    execute: async function(){
      await fs.appendFile(
        './refunds.txt',
        `refund for customer having id ${customerId} for ${reason}`,
        'utf-8'
    );
    return {refunIssued: true};
    },
})
const refundAgent = new Agent({
    name: 'refund_agent',
    instructions: `You are an expert in issuing refunds to the customer`,
    tools:[processRefund],
});

const salesAgent = new Agent({
    name: 'sales_agent',
    instructions: `You are an expert sales agent for an internet broadband company.
    Talk to the user and help them with what they need.`,
    tools:[
        fetchAvailablePlans,
    ],
});

const receptionAgent = new Agent({
    name: 'reception_agent',
    instructions: `You are the customer facing agent expert in understanding
    what the customer needs and handoff them to the right agent`,
    handoffDescription: `
    ${RECOMMENDED_PROMPT_PREFIX}
    You have two agents available:
    - salesAgent: Expert in handling queries like all plans and pricing available. Good for new customers.
    - refundAgent: Expert in handling user queries for existing customers and issue refunds and help them
    `,
    handoffs: [salesAgent, refundAgent],
});
async function runAgent(query = ''){
  try{
    const result = await run(receptionAgent, query);
    console.log(result.finalOutput);
  } catch (error) {
    console.error("--- FULL ERROR DETAILS ---");
    console.dir(error, { depth: null });
  }
}

runAgent(`hey there, i want to know the availbale plans.`);