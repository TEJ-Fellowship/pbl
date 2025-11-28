/**
 * Redis Pipeline Utility
 * Optimizes batch Redis operations by batching commands
 *
 * What is a pipeline?
 * - Instead of: Command1 → Wait → Response1 → Command2 → Wait → Response2
 * - Pipeline: Command1, Command2, Command3 → Wait → Response1, Response2, Response3
 * - Much faster for multiple operations!
 */

const redis = require("./redis");

/**
 * Execute multiple Redis commands in a pipeline
 * All commands are sent together, then all responses are received together
 * @param {Array<Function>} commands - Array of Redis command functions
 * @returns {Promise<Array>} Array of results in the same order as commands
 *
 * @example
 * const results = await executePipeline([
 *   () => redis.setEx('key1', 60, 'value1'),
 *   () => redis.sAdd('set1', 'member1'),
 *   () => redis.get('key2')
 * ]);
 */
async function executePipeline(commands) {
  if (!commands || commands.length === 0) {
    return [];
  }

  if (!redis.isReady) {
    throw new Error("Redis not ready");
  }

  // Create a pipeline
  const pipeline = redis.multi();

  // Queue all commands in the pipeline
  const promises = commands.map((command) => {
    // Execute the command and add it to pipeline
    // Note: In Redis v5, we need to handle this differently
    // The command function should return the pipeline command
    return command(pipeline);
  });

  // Execute the pipeline (all commands sent together)
  const results = await pipeline.exec();

  return results;
}

/**
 * Helper: Create a pipeline-friendly command wrapper
 * This makes it easier to use pipelines with existing Redis commands
 * @param {Function} commandFn - Redis command function
 * @param {...any} args - Arguments for the command
 * @returns {Function} Pipeline command function
 */
function pipelineCommand(commandFn, ...args) {
  return (pipeline) => {
    return commandFn.apply(pipeline, args);
  };
}

/**
 * Execute batch write operations using pipeline
 * Optimized for multiple SET/SADD/SREM operations
 * @param {Array<Object>} operations - Array of operation objects
 * @param {string} operations[].type - 'setEx', 'sAdd', 'sRem', 'expire', etc.
 * @param {Array} operations[].args - Arguments for the operation
 * @returns {Promise<Array>} Results array
 *
 * @example
 * await batchWrite([
 *   { type: 'setEx', args: ['key1', 60, 'value1'] },
 *   { type: 'sAdd', args: ['set1', 'member1'] },
 *   { type: 'sRem', args: ['set2', 'member2'] }
 * ]);
 */
async function batchWrite(operations) {
  if (!operations || operations.length === 0) {
    return [];
  }

  if (!redis.isReady) {
    throw new Error("Redis not ready");
  }

  // Create a pipeline
  const pipeline = redis.multi();

  // Queue all operations
  for (const op of operations) {
    const { type, args } = op;

    // Check if command exists on pipeline object
    if (typeof pipeline[type] !== "function") {
      throw new Error(`Unknown Redis command: ${type}`);
    }

    // Add command to pipeline (spread args to pass as individual arguments)
    pipeline[type](...args);
  }

  // Execute pipeline (all commands sent at once, all responses received together)
  // Returns array of [error, result] pairs
  let results;
  try {
    results = await pipeline.exec();
  } catch (execError) {
    throw new Error(
      `Pipeline execution failed: ${
        execError?.message || execError?.toString() || String(execError)
      }`
    );
  }

  // Check for errors in results
  if (!results || !Array.isArray(results)) {
    throw new Error(
      `Pipeline returned invalid results: ${JSON.stringify(results)}`
    );
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    // Handle different result formats
    let error = null;
    if (Array.isArray(result)) {
      [error] = result;
    } else if (result instanceof Error) {
      error = result;
    } else if (result && typeof result === "object" && result.error) {
      error = result.error;
    }

    if (error) {
      // Better error handling - error might be a string or object
      const errorMsg =
        error?.message || error?.toString() || String(error) || "Unknown error";
      const commandType = operations[i]?.type || "unknown";
      const commandArgs = operations[i]?.args
        ? JSON.stringify(operations[i].args.slice(0, 2))
        : "unknown";
      throw new Error(
        `Pipeline command ${i} (${commandType} ${commandArgs}) failed: ${errorMsg}`
      );
    }
  }

  return results;
}

module.exports = {
  executePipeline,
  pipelineCommand,
  batchWrite,
};
