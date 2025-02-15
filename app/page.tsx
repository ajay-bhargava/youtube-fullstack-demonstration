import VideoAnalysis from "./components/VideoAnalysis";
import TweetGenerator from "./components/TweetGenerator";

export default function Home() {
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
			<main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-4xl">
				<div className="w-full space-y-8">
					<div className="flex flex-col space-y-4">
						<h2 className="text-2xl font-bold">Video Analysis</h2>
						<VideoAnalysis />
					</div>

					<div className="border-t pt-8">
						<h2 className="text-2xl font-bold mb-4">Tweet Generator</h2>
						<TweetGenerator />
					</div>
				</div>
			</main>
		</div>
	);
}
