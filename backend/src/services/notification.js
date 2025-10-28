const admin = require('firebase-admin');
const logger = require('../utils/logger');

// ====================
// Firebase Admin Initialization
// ====================
let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../../keys/firebase-service-account.json');
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      
      logger.info('Firebase Admin SDK initialized successfully');
    }
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase initialization error:', error);
    throw error;
  }
};

// ====================
// Notification Functions
// ====================

/**
 * Send push notification to a single device
 * @param {string} token - FCM device token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<string>} - Message ID
 */
const sendToDevice = async (token, notification, data = {}) => {
  try {
    if (!firebaseApp) initializeFirebase();
    
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image || undefined
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true
          }
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    logger.info('Notification sent successfully:', response);
    
    return response;
  } catch (error) {
    logger.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send push notification to multiple devices
 * @param {Array<string>} tokens - Array of FCM device tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Batch response
 */
const sendToMultipleDevices = async (tokens, notification, data = {}) => {
  try {
    if (!firebaseApp) initializeFirebase();
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image || undefined
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    
    logger.info(`Notifications sent: ${response.successCount}/${tokens.length}`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
    }
    
    return response;
  } catch (error) {
    logger.error('Error sending batch notifications:', error);
    throw error;
  }
};

/**
 * Send notification to topic
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<string>} - Message ID
 */
const sendToTopic = async (topic, notification, data = {}) => {
  try {
    if (!firebaseApp) initializeFirebase();
    
    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image || undefined
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };
    
    const response = await admin.messaging().send(message);
    logger.info(`Notification sent to topic ${topic}:`, response);
    
    return response;
  } catch (error) {
    logger.error('Error sending topic notification:', error);
    throw error;
  }
};

/**
 * Subscribe device tokens to a topic
 * @param {Array<string>} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Subscription response
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) initializeFirebase();
    
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info(`${response.successCount} tokens subscribed to ${topic}`);
    
    return response;
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
    throw error;
  }
};

/**
 * Unsubscribe device tokens from a topic
 * @param {Array<string>} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Unsubscription response
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) initializeFirebase();
    
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    logger.info(`${response.successCount} tokens unsubscribed from ${topic}`);
    
    return response;
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
    throw error;
  }
};

// ====================
// Notification Templates
// ====================

/**
 * Send new episode notification
 * @param {Array<string>} tokens - User device tokens
 * @param {Object} episode - Episode data
 * @param {Object} series - Series data
 */
const sendNewEpisodeNotification = async (tokens, episode, series) => {
  const notification = {
    title: `New Episode: ${series.title}`,
    body: `${episode.title} is now available!`,
    image: episode.thumbnail_url
  };
  
  const data = {
    type: 'new_episode',
    episodeId: episode.id,
    seriesId: series.id
  };
  
  return await sendToMultipleDevices(tokens, notification, data);
};

/**
 * Send continue watching reminder
 * @param {string} token - User device token
 * @param {Object} episode - Episode data
 * @param {Object} series - Series data
 * @param {number} progress - Watch progress percentage
 */
const sendContinueWatchingNotification = async (token, episode, series, progress) => {
  const notification = {
    title: 'Continue Watching',
    body: `You left off at ${Math.round(progress)}% of "${episode.title}"`,
    image: series.thumbnail_url
  };
  
  const data = {
    type: 'continue_watching',
    episodeId: episode.id,
    seriesId: series.id,
    progress: progress.toString()
  };
  
  return await sendToDevice(token, notification, data);
};

/**
 * Send promotional notification
 * @param {Array<string>} tokens - User device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 */
const sendPromotionalNotification = async (tokens, title, body, data = {}) => {
  const notification = {
    title,
    body
  };
  
  const notificationData = {
    type: 'promotion',
    ...data
  };
  
  return await sendToMultipleDevices(tokens, notification, notificationData);
};

// ====================
// Exports
// ====================
module.exports = {
  initializeFirebase,
  sendToDevice,
  sendToMultipleDevices,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendNewEpisodeNotification,
  sendContinueWatchingNotification,
  sendPromotionalNotification
};
