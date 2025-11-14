const Player = require("./player");
const GameMode = require("./game");
const ScoreSubmission = require("./scoreSubmission");

Player.hasMany(ScoreSubmission, { foreignKey: "player_id", as: "scoreSubmissions" });
ScoreSubmission.belongsTo(Player, { foreignKey: "player_id", as: "player" });

GameMode.hasMany(ScoreSubmission, { foreignKey: "game_mode_id", as: "scoreSubmissions" });
ScoreSubmission.belongsTo(GameMode, { foreignKey: "game_mode_id", as: "gameMode" });

module.exports = {
  Player,
  GameMode,
  ScoreSubmission,
};