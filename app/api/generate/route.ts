import { createClient } from "@/app/utils/supabase/server";
import { cookies } from "next/headers";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, // Make sure to add this to your env variables
});

export async function POST(req: Request) {
  try {
    const { youtubeLink } = await req.json();
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // First get the youtube_id from youtube_table
    const { data: video, error: videoError } = await supabase
      .from("youtube_table")
      .select("id")
      .eq("youtube_link", youtubeLink)
      .single();
    

    if (videoError) throw new Error(`Video error: ${videoError.message}`);
    const youtubeId = video.id;

    // Fetch transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from("transcripts")
      .select("full_text")
      .eq("youtube_id", youtubeId)
      .single();
    

    if (transcriptError || !transcript) {
      throw new Error(`Transcript error: ${transcriptError?.message || 'No transcript found'}`);
    }

    // Fetch segments
    const { data: segments, error: segmentsError } = await supabase
      .from("segments")
      .select("*")
      .eq("youtube_id", youtubeId)
      .order("start", { ascending: true });


    if (segmentsError || !segments) {
      throw new Error(`Segments error: ${segmentsError?.message || 'No segments found'}`);
    }

    // Create a mapping of timestamp to storage_url
    const imageUrls = segments.reduce((acc: Record<number, string>, segment) => {
      acc[segment.start] = segment.storage_url;
      return acc;
    }, {});

    // Prepare the data for the prompt
    const segmentsText = segments.map(segment => 
      `[${segment.start}s]: ${segment.text}`
    ).join('\n');

    // Construct your prompt
    const prompt = `
        Transcript: ${transcript.full_text}

        Detailed segments with timestamps:
        ${segmentsText}

        Generate a JSON response with the following structure:
        {
          "summary": "brief summary of the content",
          "keyPoints": ["array", "of", "key", "points"],
          "timestamps": {
            "important_moment": "timestamp"
          }
        }
        Make sure to include all timestamps in the "timestamps" object. Keep in mind that the timestamps are in milliseconds. Return only the top 3 moments from the video.
        `;

    // Create chat completion with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates structured JSON responses about video content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const parsedResponse = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Add the image URLs to the response
    return Response.json({
      ...parsedResponse,
      images: imageUrls
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { status: 500 }
    );
  }
}