import 'dotenv/config';
import {Agent,run} from "@openai/agents";

const helloAgent = new Agent({
    name:"Hello Agent",
    instructions: "you are an agent that says hello world",
});

run(helloAgent, "hey there, my name is Parag Jain")
    .then((result) => {
        console.log(result.finalOutput);
    })
    .catch((error) => {
        console.error("ERROR:", error);
    });
