const express = require('express');
const router = express.Router();
const Episode = require('../models/Episode');
const Series = require('../models/Series');
const CoinBalance = require('../models/CoinBalance');
const CoinTransaction = require('../models/CoinTransaction');
const Subscription = require('../models/Subscription');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, PaymentError } = require('../middleware/errorHandler');
const { getCache, setCache } = require('../config/redis');
const logger = require('../utils/logger');

// ====================
// GET /episodes/:id
// Get episode details
// ====================
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const cacheKey = `episode:${id}`;
  let episode = await getCache(cacheKey);
  
  if (!episode) {
    episode = await Episode.findOne({
      where: { id, status: 'live' },
      include: [
        {
          model: Series,
          as: 'series',
          attributes: ['id', 'title', 'thumbnail_url']
        }
      ]
    });
    
    if (!episode) {
      throw new NotFoundError('Episode');
    }
    
    await setCache(cacheKey, episode.toJSON(), 900); // 15 minutes
  }
  
  // Check if user can access
  const userId = req.userId;
  let canAccess = !episode.is_locked;
  let unlockRequired = false;
  let unlockInfo = null;
  
  if (userId && episode.is_locked) {
    // Check subscription
    const hasSubscription = await Subscription.hasActiveSubscription(userId);
    
    // Check coin balance
    const coinBalance = await CoinBalance.getUserBalance(userId);
    
    canAccess = episode.canAccess(hasSubscription, coinBalance);
    
    if (!canAccess) {
      unlockRequired = true;
      unlockInfo = {
        type: episode.unlock_type,
        cost: episode.unlock_cost,
        userHasSubscription: hasSubscription,
        userCoinBalance: coinBalance
      };
    }
  }
  
  // Hide playback URLs if locked
  if (episode.is_locked && !canAccess) {
    delete episode.hls_manifest_url;
    delete episode.dash_manifest_url;
    delete episode.video_url;
  }
  
  res.json({
    success: true,
    data: {
      episode,
      canAccess,
      unlockRequired,
      unlockInfo
    }
  });
}));

// ====================
// POST /episodes/:id/unlock
// Unlock episode with coins
// ====================
router.post('/:id/unlock', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  
  const episode = await Episode.findByPk(id);
  
  if (!episode) {
    throw new NotFoundError('Episode');
  }
  
  if (!episode.is_locked) {
    return res.json({
      success: true,
      message: 'Episode is already free to watch'
    });
  }
  
  // Check if already unlocked
  const alreadyUnlocked = await CoinTransaction.findOne({
    where: {
      user_id: userId,
      reference_type: 'episode',
      reference_id: id,
      type: 'spend',
      status: 'completed'
    }
  });
  
  if (alreadyUnlocked) {
    return res.json({
      success: true,
      message: 'Episode already unlocked'
    });
  }
  
  // Check subscription
  if (episode.unlock_type === 'subscription') {
    const hasSubscription = await Subscription.hasActiveSubscription(userId);
    
    if (!hasSubscription) {
      throw new PaymentError('Active subscription required to unlock this episode');
    }
    
    // Subscription grants access, no coins needed
    return res.json({
      success: true,
      message: 'Episode unlocked with subscription'
    });
  }
  
  // Unlock with coins
  if (episode.unlock_type === 'coins') {
    const balance = await CoinBalance.getOrCreate(userId);
    
    if (!balance.hasSufficientBalance(episode.unlock_cost)) {
      throw new PaymentError(`Insufficient coins. Required: ${episode.unlock_cost}, Available: ${balance.balance}`);
    }
    
    // Create transaction
    await CoinTransaction.createSpend(
      userId,
      episode.unlock_cost,
      'episode',
      id,
      `Unlocked episode: ${episode.title}`
    );
    
    logger.logUserAction(userId, 'EPISODE_UNLOCK', {
      episodeId: id,
      cost: episode.unlock_cost
    });
    
    return res.json({
      success: true,
      message: 'Episode unlocked successfully',
      data: {
        remainingCoins: balance.balance - episode.unlock_cost
      }
    });
  }
  
  throw new PaymentError('Invalid unlock type');
}));

// ====================
// GET /episodes/:id/manifest
// Get video manifest URL (HLS/DASH)
// ====================
router.get('/:id/manifest', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { platform = 'ios' } = req.query;
  const userId = req.userId;
  
  const episode = await Episode.findByPk(id);
  
  if (!episode) {
    throw new NotFoundError('Episode');
  }
  
  if (!episode.isAvailable()) {
    throw new NotFoundError('Episode not available');
  }
  
  // Check access
  if (episode.is_locked) {
    const hasSubscription = await Subscription.hasActiveSubscription(userId);
    const coinBalance = await CoinBalance.getUserBalance(userId);
    
    const hasUnlocked = await CoinTransaction.findOne({
      where: {
        user_id: userId,
        reference_type: 'episode',
        reference_id: id,
        type: 'spend',
        status: 'completed'
      }
    });
    
    if (!hasSubscription && !hasUnlocked) {
      throw new PaymentError('Episode must be unlocked before playback');
    }
  }
  
  const manifestUrl = episode.getPlaybackUrl(platform);
  
  res.json({
    success: true,
    data: {
      manifestUrl,
      platform,
      duration: episode.duration,
      availableResolutions: episode.available_resolutions,
      subtitles: episode.subtitles
    }
  });
}));

// ====================
// GET /episodes/:id/next
// Get next episode in series
// ====================
router.get('/:id/next', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const nextEpisode = await Episode.getNextEpisode(id);
  
  if (!nextEpisode) {
    return res.json({
      success: true,
      data: { nextEpisode: null }
    });
  }
  
  res.json({
    success: true,
    data: { 
      nextEpisode: {
        id: nextEpisode.id,
        title: nextEpisode.title,
        episode_number: nextEpisode.episode_number,
        thumbnail_url: nextEpisode.thumbnail_url,
        duration: nextEpisode.duration,
        is_locked: nextEpisode.is_locked,
        unlock_type: nextEpisode.unlock_type,
        unlock_cost: nextEpisode.unlock_cost
      }
    }
  });
}));

// ====================
// POST /episodes/:id/like
// Like an episode
// ====================
router.post('/:id/like', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  
  // TODO: Implement likes table
  // For now, just increment counter
  const episode = await Episode.findByPk(id);
  
  if (!episode) {
    throw new NotFoundError('Episode');
  }
  
  episode.like_count += 1;
  await episode.save();
  
  logger.logUserAction(userId, 'EPISODE_LIKE', { episodeId: id });
  
  res.json({
    success: true,
    message: 'Episode liked',
    data: {
      likeCount: episode.like_count
    }
  });
}));

module.exports = router;
