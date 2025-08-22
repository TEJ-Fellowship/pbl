import { config } from "./index.js";

export const getVectorStoreConfig = () => {
  const langchainConfig = config.getLangChainConfig();

  return {
    chunkSize: langchainConfig.chunkSize,
    chunkOverlap: langchainConfig.chunkOverlap,
    embeddingModel: langchainConfig.embeddingModel,
  };
};
