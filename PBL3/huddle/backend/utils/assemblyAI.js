import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

const submitTranscription = async (audioUrl) => {
  try {
    const config = {
      audio_url: audioUrl,
      language_detection: true,
    };

    const transcript = await client.transcripts.submit(config);
    return transcript.id;
  } catch (error) {
    throw new Error(`Failed to submit transcription: ${error.message}`);
  }
};

const getTranscriptionResult = async (transcriptId) => {
  try {
    const transcript = await client.transcripts.get(transcriptId);
    return transcript;
  } catch (error) {
    console.error("Error getting transcription result:", error);
    throw new Error(`Failed to get transcription result: ${error.message}`);
  }
};

const waitForTranscription = async (transcriptId, maxWaitTime = 300000) => {
  const startTime = Date.now();
  const pollInterval = 3000; // Check every 3 seconds

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const transcript = await getTranscriptionResult(transcriptId);
      console.log(`AssemblyAI: Transcription status: ${transcript.status}`);

      if (transcript.status === "completed") {
        console.log("AssemblyAI: Transcription completed successfully");
        return transcript;
      } else if (transcript.status === "error") {
        console.error(
          "AssemblyAI: Transcription failed with error:",
          transcript.error
        );
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(
        "AssemblyAI: Error while waiting for transcription:",
        error
      );
      throw error;
    }
  }

  console.error("AssemblyAI: Transcription timeout after", maxWaitTime, "ms");
  throw new Error("Transcription timeout: Process took too long to complete");
};

const transcribeAudio = async (audioUrl) => {
  try {
    console.log("Submitting audio for transcription:", audioUrl);
    const transcriptId = await submitTranscription(audioUrl);

    console.log("Waiting for transcription to complete, ID:", transcriptId);
    const result = await waitForTranscription(transcriptId);

    return {
      id: result.id,
      text: result.text,
      status: result.status,
      audio_duration: result.audio_duration,
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw error;
  }
};

export {
  transcribeAudio,
  submitTranscription,
  getTranscriptionResult,
  waitForTranscription,
};
