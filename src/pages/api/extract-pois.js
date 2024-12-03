import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts complete location entries from text.
          Each location should include the full name, address, and city as a single entry.
          Keep each location as ONE complete entry, do not split addresses into parts. Separate different locations with newlines.
          Example input: 'There is a nice restaurant called Gustl Kitchen in Wiedner Hauptstrasse and I also like to visit Schönbrunn Palace' should return: 'Gustl Kitchen, Wiedner Hauptstrasse, Vienna\nSchönbrunn Palace, Schönbrunner Schlossstrasse 47, 1130 Vienna'.
          Do not include any other text in your response. Always include the city Vienna if no other city is mentioned.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const locationText = completion.choices[0].message.content;
    const pois = locationText.split('\n').map(poi => poi.trim()).filter(poi => poi);

    res.status(200).json({ pois });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ message: 'Error processing text' });
  }
}
