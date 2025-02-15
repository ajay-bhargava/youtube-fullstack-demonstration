import { createClient } from "@/app/utils/supabase/server";
import { cookies } from "next/headers";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { youtubeLink } = await req.json();
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // ... existing code ...
    const { data: video, error: videoError } = await supabase
      .from("youtube_table")
      .select("id")
      .eq("youtube_link", youtubeLink)
      .single();

    if (videoError) throw new Error(`Video error: ${videoError.message}`);
    const youtubeId = video.id;

    const { data: transcript, error: transcriptError } = await supabase
      .from("transcripts")
      .select("full_text")
      .eq("youtube_id", youtubeId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error(`Transcript error: ${transcriptError?.message || 'No transcript found'}`);
    }

    // Fetch segments for the thumbnail image
    const { data: segments, error: segmentsError } = await supabase
      .from("segments")
      .select("*")
      .eq("youtube_id", youtubeId)
      .order("start", { ascending: true });

    if (segmentsError || !segments) {
      throw new Error(`Segments error: ${segmentsError?.message || 'No segments found'}`);
    }

    // Get the first segment's image as the tweet thumbnail
    const thumbnailUrl = segments[0]?.storage_url;

    const prompt = `
        Based on this transcript of a YouTube video:
        ${transcript.full_text}

        Generate a compelling tweet (maximum 280 characters) that summarizes the main point or most interesting aspect of this video.
        The tweet should be engaging and make people want to watch the video.
        
        Return a JSON response with this structure:
        {
          "tweet": "the generated tweet text"
        }
        `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a social media expert who creates engaging tweets about video content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const parsedResponse = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Add the thumbnail URL to the response
    return Response.json({
      ...parsedResponse,
      thumbnailUrl
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { status: 500 }
    );
  }
}