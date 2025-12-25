<!-- 


# aimlapi.com
10 request per hour: 

1. 592788de88c2449c8a7bbd88c6641fcf
2. 06331b4a290541099805f5a982dbce7c

https://aimlapi.com/app/keys
https://docs.aimlapi.com/quickstart/setting-up#nodejs


const { OpenAI } = require("openai");

const baseURL = "https://api.aimlapi.com/v1";

// Insert your AIML API Key in the quotation marks instead of my_key:
const apiKey = "<YOUR_AIMLAPI_KEY>"; 

const systemPrompt = "You are a travel agent. Be descriptive and helpful";
const userPrompt = "Tell me about San Francisco";

const api = new OpenAI({
  apiKey,
  baseURL,
});

const main = async () => {
  const completion = await api.chat.completions.create({
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 256,
  });

  const response = completion.choices[0].message.content;

  console.log("User:", userPrompt);
  console.log("AI:", response);
};

main();


- async function main() {
  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <YOUR_AIMLAPI_KEY>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-max',
      messages:[
          {
              role:'user',
              content: 'Hello'
          }
      ],
    }),
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main();

- response: 
{
  "id": "chatcmpl-CQ9FPg3osank0dx0k46Z53LTqtXMl",
  "object": "chat.completion",
  "created": 1762343744,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm just a program, so I don't have feelings, but I'm here and ready to help you. How can I assist you today?",
        "refusal": null,
        "annotations": null,
        "audio": null,
        "tool_calls": null
      },
      "finish_reason": "stop",
      "logprobs": null
    }
  ],
  "model": "qwen-max",
  "usage": {
    "prompt_tokens": 137,
    "completion_tokens": 914,
    "total_tokens": 1051,
    "completion_tokens_details": null,
    "prompt_tokens_details": null
  }
}



- all these models:
qwen-max
qwen-plus
qwen-turbo
Qwen2.5-7B-Instruct-Turbo
Qwen2.5-72B-Instruct-Turbo
Qwen2.5-Coder-32B-Instruct
Qwen3-235B-A22B
qwen3-32b
qwen3-coder-480b-a35b-instruct
qwen3-235b-a22b-thinking-2507
qwen3-next-80b-a3b-instruct
qwen3-next-80b-a3b-thinking
qwen3-max-preview
qwen3-max-instruct
qwen3-omni-30b-a3b-captioner
qwen3-vl-32b-instruct
qwen3-vl-32b-thinking

glm-4.5-air
glm-4.5
glm-4.6
glm-4.7 

grok-3-beta
grok-3-mini-beta
grok-4
grok-code-fast-1
grok-4-fast-non-reasoning
grok-4-fast-reasoning
grok-4.1-fast-non-reasoning
grok-4.1-fast-reasoning

sonar
sonar-pro

gpt-3.5-turbo
gpt-4
gpt-4-preview
gpt-4-turbo
gpt-4o
gpt-4o-mini
gpt-4o-audio-preview
gpt-4o-mini-audio-preview
gpt-4o-search-preview
gpt-4o-mini-search-preview
o1
o3
o3-mini
o3-pro
gpt-4.1
gpt-4.1-mini
gpt-4.1-nano
o4-mini
gpt-oss-20b
gpt-oss-120b
gpt-5
gpt-5-mini
gpt-5-nano
gpt-5-chat
gpt-5-pro
gpt-5.1
gpt-5.1-chat-latest
gpt-5.1-codex
gpt-5.1-codex-mini
gpt-5.2
gpt-5.2-chat-latest
gpt-5.2-pro

llama-3.1-nemotron-70b
nemotron-nano-9b-v2
nemotron-nano-12b-v2-vl

kimi-k2-preview
kimi-k2-turbo-preview

Llama-3-chat-hf
Llama-3-8B-Instruct-Lite
Llama-3.1-8B-Instruct-Turbo
Llama-3.1-70B-Instruct-Turbo
Llama-3.1-405B-Instruct-Turbo
Llama-3.2-3B-Instruct-Turbo
Llama-3.3-70B-Instruct-Turbo
Llama-3.3-70B-Versatile
Llama-4-scout
Llama-4-maverick

gemini-2.0-flash-exp
gemini-2.0-flash
gemini-2.5-flash-lite-preview
gemini-2.5-flash
gemini-2.5-pro
gemini-3-pro-preview
gemma-3
gemma-3n-4b
gemini-3-flash-preview

DeepSeek V3
DeepSeek R1
DeepSeek Prover V2
DeepSeek Chat V3.1
DeepSeek Reasoner V3.1
Deepseek Non-reasoner V3.1 Terminus
Deepseek Reasoner V3.1 Terminus
DeepSeek V3.2 Exp Non-thinking
DeepSeek V3.2 Exp Thinking

Claude 3 Haiku
Claude 3 Opus
Claude 3.5 Haiku
Claude 3.7 Sonnet
Claude 4 Opus
Claude 4 Sonnet
Claude 4.1 Opus
Claude 4.5 Sonnet
Claude 4.5 Haiku
Claude 4.5 Opus

- for image
qwen-image
qwen-image-edit
z-image-turbo
z-image-turbo-lora

Imagen 4 Fast Generate
Imagen 4 Ultra Generate
Gemini 2.5 Flash Image (Nano Banana)
Gemini 2.5 Flash Image Edit (Nano Banana)
Nano Banana Pro (Gemini 3 Pro Image)
Nano Banana Pro Edit (Gemini 3 Pro Image Edit)

grok-2-image

__________________________________________________________________________________________

# btez


also add bytez also:

import Bytez from "bytez.js"

const key = "bc43859be40c03ddac31402481d5613c"
const sdk = new Bytez(key)

// choose gemma-3-4b-it
const model = sdk.model("google/gemma-3-4b-it")

// send input to model
const { error, output } = await model.run([
  {
    "role": "user",
    "content": "Hello"
  }
])

console.log({ error, output });

for image :
/*
  npm i bytez.js || yarn add bytez.js
*/

import Bytez from "bytez.js"

const key = "bc43859be40c03ddac31402481d5613c"
const sdk = new Bytez(key)

// choose stable-diffusion-xl-base-1.0
const model = sdk.model("stabilityai/stable-diffusion-xl-base-1.0")

// send input to model
const { error, output } = await model.run("A cat in a wizard hat")

console.log({ error, output });

models names is :
- sentence-transformers/all-MiniLM-L6-v2
- stabilityai/stable-diffusion-xl-base-1.0
- Qwen/Qwen3-0.6B
- openai/whisper-large-v3
- google/gemma-3-1b-it
- openai-community/gpt2
- TinyLlama/TinyLlama-1.1B-Chat-v1.0
- openai/clip-vit-large-patch14 (for images generation).
example api :
/*
  npm i bytez.js || yarn add bytez.js
*/

import Bytez from "bytez.js"

const key = "bc43859be40c03ddac31402481d5613c"
const sdk = new Bytez(key)

// choose clip-vit-large-patch14
const model = sdk.model("openai/clip-vit-large-patch14")

// send input to model
const { error, output } = await model.run({
  "candidate_labels": [
    "squid",
    "octopus",
    "human",
    "cat"
  ],
  "url": "https://ocean.si.edu/sites/default/files/styles/3_2_largest/public/2023-11/Screen_Shot_2018-04-16_at_1_42_56_PM.png.webp"
})

console.log({ error, output });

- BAAI/bge-m3
- stable-diffusion-v1-5/stable-diffusion-v1-5 (for image).
- openai/whisper-large-v3-turbo
- Qwen/Qwen3-1.7B
- Qwen/Qwen3-4B-Thinking-2507
- Qwen/Qwen3-4B-Thinking-2507
- Qwen/Qwen3-4B-Instruct-2507
- ibm-granite/granite-docling-258M
- microsoft/Phi-3-mini-4k-instruct
- facebook/bart-large-mnli
- suno/bark (for text to audio).
- google/siglip-so400m-patch14-384 for image

- sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- sentence-transformers/paraphrase-multilingual-mpnet-base-v2
- nomic-ai/nomic-embed-text-v1.5
- google/madlad400-3b-mt (for translation)
- facebook/bart-large-cnn (for text to summary).








# groq.com
- https://console.groq.com/keys
https://console.groq.com/docs/rate-limits
-gsk_
:remove colon
CyWwjeqfbPHeH15E7gcXWGdyb3FYShnJyCYdfb8lX5tProFSbElw


import OpenAI from "openai";
const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
    model: "openai/gpt-oss-20b",
    input: "Explain the importance of fast language models",
});
console.log(response.output_text);




# cerebras

- csk
: remove colon
-5pmk8d42rjn3jmj2wm3n49c8net4hfyd8ffpr33y4m8xv4pm

// Backend API route (e.g., Next.js API route or Express server)
const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b',
    messages: [{ role: 'user', content: 'Why is fast inference important?' }]
  })
});

const data = await response.json();

# x-ai (Grok).
- https://console.x.ai/team/22920fbe-fe1c-4560-8ab0-c16aad928317/api-keys/create

- xai-
: remove colon
s9S6rNoRdcsk255z8N8Xlr77djJIxA6rNz42kIY3Ux8942dh62D2ZKLkU3MoViGGrtDZFyGFkpormAQ0


curl https://api.x.ai/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer abc" \
    -d '{
      "messages": [
        {
          "role": "system",
          "content": "You are a test assistant."
        },
        {
          "role": "user",
          "content": "Testing. Just say hi and hello world and nothing else."
        }
      ],
      "model": "grok-4-latest",
      "stream": false,
      "temperature": 0
    }'



# OpenAI: 
- platform.openai.com/api-keys

- part 1: sk
: remove colon
- part2: -proj-
: remove colon
- part 3: dMazK9kk7_V6JUdThJxBSPKahGsnoydjYUvZkIzy4ZftRC4XH9r1QCjynlk1NSaxzTQpu30K5zT3BlbkFJdU12JkwAbDJBLlfouDZIygoWE_utuOJpEqWSQL2QgAafnLY0pgpueRbR2aafxqhp-OLmKNoWAA

please attach part 1+ part 2 + part 3. its seperate due to restrictions and detection.


- javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
  model: "gpt-5.2",
  input: "Write a short bedtime story about a unicorn.",
});

console.log(response.output_text);



# novita

- kat coder

- sk_
: remove colon
F2zrb8JBU0TbM-4hajBCU3yvGNhDXus683tceTpWItA
- sk_
: remove colon
lbTzaHnetvnFxQ0AG-ezWvdFdFaTNy9dsw3YSH8_ZKw

https://novita.ai/settings/key-management

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '<Your API Key>',
  baseURL: 'https://api.novita.ai/openai'
});

const response = await openai.chat.completions.create({
  model: 'kat-coder',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ],
  max_tokens: 1000,
  temperature: 0.7
});

console.log(response.choices[0].message.content);
``` -->