const { v4: uuidv4 } = require('uuid');

// Generate random player data for score submission
function generatePlayerData(context, events, done) {
  context.vars.playerId = uuidv4();
  context.vars.username = `player_${Math.floor(Math.random() * 1000000)}`;
  context.vars.gameMode = Math.floor(Math.random() * 3) + 1; // Game modes 1-3
  context.vars.score = Math.floor(Math.random() * 100000) + 1000; // Score between 1000-101000
  context.vars.gameDuration = Math.floor(Math.random() * 600) + 60; // Duration 60-660 seconds
  return done();
}

// Generate random game mode
function generateGameMode(context, events, done) {
  context.vars.gameMode = Math.floor(Math.random() * 3) + 1; // Game modes 1-3
  return done();
}

// Generate player ID and game mode
function generatePlayerAndGameMode(context, events, done) {
  // Use existing player IDs if available, otherwise generate new ones
  if (!context.vars.existingPlayerIds) {
    context.vars.existingPlayerIds = [];
  }
  
  // 70% chance to use existing player, 30% chance to generate new
  if (context.vars.existingPlayerIds.length > 0 && Math.random() < 0.7) {
    context.vars.playerId = context.vars.existingPlayerIds[
      Math.floor(Math.random() * context.vars.existingPlayerIds.length)
    ];
  } else {
    context.vars.playerId = uuidv4();
    context.vars.existingPlayerIds.push(context.vars.playerId);
    // Keep only last 1000 player IDs in memory
    if (context.vars.existingPlayerIds.length > 1000) {
      context.vars.existingPlayerIds.shift();
    }
  }
  
  context.vars.gameMode = Math.floor(Math.random() * 3) + 1;
  return done();
}

// Generate player ID
function generatePlayerId(context, events, done) {
  if (!context.vars.existingPlayerIds) {
    context.vars.existingPlayerIds = [];
  }
  
  if (context.vars.existingPlayerIds.length > 0 && Math.random() < 0.7) {
    context.vars.playerId = context.vars.existingPlayerIds[
      Math.floor(Math.random() * context.vars.existingPlayerIds.length)
    ];
  } else {
    context.vars.playerId = uuidv4();
    context.vars.existingPlayerIds.push(context.vars.playerId);
    if (context.vars.existingPlayerIds.length > 1000) {
      context.vars.existingPlayerIds.shift();
    }
  }
  return done();
}

module.exports = {
  generatePlayerData,
  generateGameMode,
  generatePlayerAndGameMode,
  generatePlayerId
};
