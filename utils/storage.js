import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants - Static storage key for persistent data
const APP_PREFIX = 'taskmanager';
const STORAGE_KEY = `@${APP_PREFIX}_tasks_v1`;

/**
 * Storage utility functions for task persistence
 * Handles all AsyncStorage operations with error handling
 */
export const TaskStorage = {
  /**
   * Load tasks from AsyncStorage
   * @returns {Promise<Array>} Array of task objects
   */
  async loadTasks() {
    try {
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedTasks) {
        return [];
      }
      
      // Validate JSON before parsing
      const parsedTasks = JSON.parse(storedTasks);
      
      // Validate data structure
      if (!Array.isArray(parsedTasks)) {
        console.warn('Invalid task data structure, resetting to empty array');
        return [];
      }
      
      return parsedTasks;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Corrupted task data detected, clearing storage:', error);
        // Clear corrupted data
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        console.error('Error loading tasks:', error);
      }
      return [];
    }
  },

  /**
   * Save tasks to AsyncStorage
   * @param {Array} tasks - Array of task objects to save
   * @returns {Promise<boolean>} Success status
   */
  async saveTasks(tasks) {
    try {
      // Validate input
      if (!Array.isArray(tasks)) {
        console.error('Invalid input: tasks must be an array');
        return false;
      }

      // Validate each task object structure
      const isValidTasks = tasks.every(task => 
        task && typeof task === 'object' && 
        typeof task.id === 'string' && 
        typeof task.text === 'string' && 
        typeof task.completed === 'boolean'
      );

      if (!isValidTasks) {
        console.error('Invalid task structure detected');
        return false;
      }

      const serializedTasks = JSON.stringify(tasks);
      
      // Validate serialized data size (AsyncStorage has ~6MB limit on iOS)
      if (serializedTasks.length > 5000000) {
        console.error('Task data too large for storage');
        return false;
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, serializedTasks);
      
      // Verify data was saved correctly
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData !== serializedTasks) {
        console.error('Data verification failed after save');
        return false;
      }
      
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded:', error);
      } else if (error instanceof TypeError) {
        console.error('Serialization error:', error);
      } else {
        console.error('Error saving tasks:', error);
      }
      return false;
    }
  },

  /**
   * Clear all tasks from storage
   * @returns {Promise<boolean>} Success status
   */
  async clearTasks() {
    try {
      // Check if key exists before attempting removal
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      if (existingData === null) {
        console.info('No tasks to clear - storage already empty');
        return true;
      }

      await AsyncStorage.removeItem(STORAGE_KEY);
      
      // Verify removal was successful
      const verifyRemoval = await AsyncStorage.getItem(STORAGE_KEY);
      if (verifyRemoval !== null) {
        console.error('Failed to clear tasks - data still exists');
        return false;
      }
      
      return true;
    } catch (error) {
      if (error.name === 'SecurityError') {
        console.error('Permission denied accessing storage:', error);
      } else if (error.name === 'InvalidAccessError') {
        console.error('Storage access invalid:', error);
      } else {
        console.error('Error clearing tasks:', error);
      }
      return false;
    }
  }
};