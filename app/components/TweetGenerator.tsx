"use client";

import { useState } from "react";

interface TweetCompletion {
	tweet: string;
	thumbnailUrl?: string;
}

export default function TweetGenerator() {
	const [youtubeLink, setYoutubeLink] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [completion, setCompletion] = useState<TweetCompletion | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setError(null);
			setIsLoading(true);

			const response = await fetch("/api/generate-tweet", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ youtubeLink }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.statusText}`);
			}

			const data = await response.json();
			setCompletion(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleShare = () => {
		if (!completion) return;

		// Create tweet URL with text and image
		const tweetText = completion.tweet;
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

		// Open Twitter intent in new window
		window.open(tweetUrl, "_blank");
	};

	return (
		<div>
			<form onSubmit={handleGenerate} className="mb-4">
				<input
					type="url"
					value={youtubeLink}
					onChange={(e) => setYoutubeLink(e.target.value)}
					placeholder="Enter YouTube URL"
					className="px-4 py-2 border rounded mr-2"
					required
				/>
				<button
					type="submit"
					disabled={isLoading}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
				>
					Generate Tweet
				</button>
			</form>
			{isLoading && <p>Loading...</p>}
			{error && <p className="text-red-500 mt-2">{error}</p>}

			{completion && (
				<div className="mt-4 p-4 bg-gray-100 rounded">
					<h3 className="text-xl font-bold mb-2">Generated Tweet</h3>
					<div className="space-y-4">
						<p className="text-gray-700">{completion.tweet}</p>

						{completion.thumbnailUrl && (
							<div className="mt-4">
								<h4 className="font-semibold mb-2">Tweet Image</h4>
								<img
									src={completion.thumbnailUrl}
									alt="Tweet thumbnail"
									className="max-w-sm rounded-lg shadow-md"
								/>
							</div>
						)}

						{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
						<button
							onClick={handleShare}
							className="mt-4 px-4 py-2 bg-[#1DA1F2] text-white rounded hover:bg-[#1a91da]"
						>
							Share on Twitter
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
