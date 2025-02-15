"use client";

import { useState } from "react";

interface VideoCompletion {
	summary: string;
	keyPoints: string[];
	timestamps: Record<string, number>;
	images?: Record<number, string>;
}

function formatTime(milliseconds: number): string {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function VideoAnalysis() {
	const [youtubeLink, setYoutubeLink] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [completion, setCompletion] = useState<VideoCompletion | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleAnalyze = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setError(null);
			setIsLoading(true);

			const response = await fetch("/api/generate", {
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

	return (
		<div>
			<form onSubmit={handleAnalyze} className="mb-4">
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
					Analyze Video
				</button>
			</form>
			{isLoading && <p>Loading...</p>}
			{error && <p className="text-red-500 mt-2">{error}</p>}

			{completion && (
				<div className="mt-4 p-4 bg-gray-100 rounded space-y-6">
					<div>
						<h3 className="text-xl font-bold mb-2">Summary</h3>
						<p className="text-gray-700">{completion.summary}</p>
					</div>

					<div>
						<h3 className="text-xl font-bold mb-2">Key Points</h3>
						<ul className="list-disc pl-5 space-y-2">
							{completion.keyPoints.map((point: string) => (
								<li key={point} className="text-gray-700">
									{point}
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="text-xl font-bold mb-2">Important Timestamps</h3>
						<ul className="list-disc pl-5 space-y-4">
							{Object.entries(completion.timestamps).map(
								([moment, timestamp]) => (
									<li key={moment} className="text-gray-700">
										<div className="flex flex-col gap-2">
											<span>
												<span className="font-medium capitalize">{moment}</span>
												: {formatTime(Number(timestamp))}
											</span>
											{completion.images?.[timestamp] && (
												<img
													src={completion.images[timestamp]}
													alt={`Timestamp ${formatTime(Number(timestamp))}`}
													className="max-w-sm rounded-lg shadow-md"
												/>
											)}
										</div>
									</li>
								),
							)}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
