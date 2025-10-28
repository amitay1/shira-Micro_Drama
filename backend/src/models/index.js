const User = require('./User');
const Series = require('./Series');
const Season = require('./Season');
const Episode = require('./Episode');
const Subscription = require('./Subscription');
const CoinBalance = require('./CoinBalance');
const CoinTransaction = require('./CoinTransaction');
const PlaybackSession = require('./PlaybackSession');
const Purchase = require('./Purchase');
const SeasonPass = require('./SeasonPass');
const Coupon = require('./Coupon');

// ====================
// Define Model Associations
// ====================

// User Associations
User.hasMany(Subscription, {
  foreignKey: 'user_id',
  as: 'subscriptions'
});

User.hasOne(CoinBalance, {
  foreignKey: 'user_id',
  as: 'coinBalance'
});

User.hasMany(CoinTransaction, {
  foreignKey: 'user_id',
  as: 'coinTransactions'
});

User.hasMany(PlaybackSession, {
  foreignKey: 'user_id',
  as: 'playbackSessions'
});

User.hasMany(Purchase, {
  foreignKey: 'user_id',
  as: 'purchases'
});

// Series Associations
Series.hasMany(Season, {
  foreignKey: 'series_id',
  as: 'seasons'
});

Series.hasMany(Episode, {
  foreignKey: 'series_id',
  as: 'episodes'
});

Series.hasMany(PlaybackSession, {
  foreignKey: 'series_id',
  as: 'playbackSessions'
});

// Season Associations
Season.belongsTo(Series, {
  foreignKey: 'series_id',
  as: 'series'
});

Season.hasMany(Episode, {
  foreignKey: 'season_id',
  as: 'episodes'
});

// Episode Associations
Episode.belongsTo(Series, {
  foreignKey: 'series_id',
  as: 'series'
});

Episode.belongsTo(Season, {
  foreignKey: 'season_id',
  as: 'season'
});

Episode.hasMany(PlaybackSession, {
  foreignKey: 'episode_id',
  as: 'playbackSessions'
});

// Subscription Associations
Subscription.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// CoinBalance Associations
CoinBalance.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// CoinTransaction Associations
CoinTransaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// PlaybackSession Associations
PlaybackSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

PlaybackSession.belongsTo(Episode, {
  foreignKey: 'episode_id',
  as: 'episode'
});

PlaybackSession.belongsTo(Series, {
  foreignKey: 'series_id',
  as: 'series'
});

// Purchase Associations
Purchase.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// SeasonPass Associations
SeasonPass.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

SeasonPass.belongsTo(Series, {
  foreignKey: 'seriesId',
  as: 'series'
});

// Coupon Associations
Coupon.belongsTo(Series, {
  foreignKey: 'seriesId',
  as: 'series'
});

// ====================
// Export All Models
// ====================
module.exports = {
  User,
  Series,
  Season,
  Episode,
  Subscription,
  CoinBalance,
  CoinTransaction,
  PlaybackSession,
  Purchase,
  SeasonPass,
  Coupon
};
