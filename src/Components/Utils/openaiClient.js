// utils/openaiClient.js
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const getOpenAIResponse = async (prompt) => {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // you can switch to gpt-4 if you have access
      messages: [
        { role: "system", content: "You are a helpful AI assistant for FamChat users." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Oops! Something went wrong with the AI. Please try again.";
  }
};
