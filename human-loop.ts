import 'dotenv/config';
import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';
import axios from 'axios';
import readline from 'node:readline/promises';
const GetWeatherResultSchema = z.object({
    city: z.string().describe('name of the city'),
    degree_c: z.number().describe('the degree celcius of the temp'),
    condition: z.string().optional().describe('condition of the weather'),
});

const getWeatherTool = tool({
    name: 'get_weather',
    description: 'returns the current weather information for the given city',
    parameters: z.object({
        city: z.string().describe('name of the city'),
    }),
    execute: async function ({ city }) {
        const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
        const response = await axios.get(url, { responseType: 'text' });
        return `The weather of ${city} is ${response.data}`;
    },
});

const sendEmailTool = tool({
    name: 'send_email',
    description: 'This tool sends an email to the user',
    parameters: z.object({
        to: z.string().describe('to email address'),
        subject: z.string().describe('subject of the email'),
        html: z.string().describe('html body of the email'),
    }),
    needsApproval: true,
    execute: async function ({ to, subject, html }) {
        const API_KEY = 'ASA_ae59e889f7c95138d346d18d39e520bca58a967d.VoLVT5lnriCX9poTFR7H4Sxx0FzSinbQ99fQH4gydG0';
        const response = await axios.post("https://api.autosend.com/v1/mails/send", {
            from: {
                email: "no-reply@example.com",
                name: "ai weather agent",
            },
            to: {
                email: to,
                name: "test user",
            },
            subject,
            html,
        },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`
                }
            });
        return response.data;
    }
});

const agent = new Agent({
    name: 'Weather Agent',
    instructions: `
        You are an expert weather agent that helps user to tell weather report
    `,
    tools: [getWeatherTool, sendEmailTool],
    outputType: GetWeatherResultSchema,
});

async function askForUserConfitmation(ques: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await rl.question(`${ques} (y/n): `);
    const normalizedAnswer = answer.toLowerCase();
    rl.close();
    return normalizedAnswer === 'y' || normalizedAnswer === 'yes';
}

async function main(query = '') {
    try {
        let result = await run(agent, query);
        let hasInterruptions = result.interruptions.length > 0;
        while (hasInterruptions) {
            const currentState = result.state
            for (const interrupt of result.interruptions) {
                if (interrupt.type === 'tool_approval_item') {
                    const isAllowed = await askForUserConfitmation(
                        `Agent ${interrupt.agent.name} is asking for calling tool ${interrupt.name} with args ${interrupt.arguments}`
                    );
                    if (isAllowed) {
                        currentState.approve(interrupt);
                    } else {
                        currentState.reject(interrupt);
                    }
                    result = await run(agent, currentState);
                    hasInterruptions = result.interruptions?.length > 0;
                }
            }
        }
    } catch (error) {
        console.error("--- FULL ERROR DETAILS ---");
        console.dir(error, { depth: null });
    }
}

main(`What is the weather of Delhi and goa and send me mail on jnvyparag2018@gmail.com?`);