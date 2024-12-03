import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions about places and locations.
          Return a list of places that answer the question, one per line.
          Format each line as: 'Name, City, Country'
          Examples:
          Input: "What is the highest building in Europe?"
          Output: "Lakhta Center, Saint Petersburg, Russia"
          
          Input: "What are the best places to eat in Vienna?"
          Output: "Steirereck, Vienna, Austria
          Amador, Vienna, Austria
          Silvio Nickol Gourmet Restaurant, Vienna, Austria
          Stiftskeller, Vienna, Austria
          Plachutta, Vienna, Austria"
          
          Do not include any other text in your response.
          Do not include numbering or bullet points.
          Each line must follow the exact format: Name, City, Country`
        },
        {
          role: "user",
          content: req.body.prompt
        }
      ],
      temperature: 0,
      max_tokens: 500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const locations = response.choices[0].message.content.trim().split('\n');
    res.status(200).json({ locations });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error processing prompt' });
  }
}
