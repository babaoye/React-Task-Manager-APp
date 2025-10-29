// React and React Native imports
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
// Third-party imports
import { Ionicons } from '@expo/vector-icons';
// Local imports
import TaskItem from './components/TaskItem';
import { TaskStorage } from './utils/storage';

/**
 * Main App Component - Task Manager
 * Provides functionality to add, view, complete, and delete tasks
 * with persistent storage using AsyncStorage
 * 
 * Features:
 * - View list of tasks
 * - Add new tasks
 * - Mark tasks as completed
 * - Delete tasks with confirmation
 * - Persistent storage across app sessions
 */
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  // State management
  const [tasks, setTasks] = useState([]); // Array of task objects
  const [inputText, setInputText] = useState(''); // Current input field value
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Animation value for fade in

  // Load tasks from storage when component mounts
  useEffect(() => {
    initializeTasks();
  }, []);

  /**
   * Initialize tasks by loading from storage
   * Called on app startup to restore previously saved tasks
   */
  const initializeTasks = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await TaskStorage.loadTasks();
      setTasks(loadedTasks);
      
      // Fade in animation after loading
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Starting with empty list.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new task to the list
   * Creates a task object with unique ID, text, and completion status
   * Validates input and persists to storage
   */
  const addTask = async () => {
    const trimmedText = inputText.trim();
    
    // Validate input
    if (!trimmedText) {
      Alert.alert('Invalid Input', 'Please enter a task description.');
      return;
    }

    try {
      // Create new task object
      const newTask = {
        id: Date.now().toString(), // Use timestamp as unique ID
        text: trimmedText,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      // Animate layout change
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Update state and persist to storage
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      const saveSuccess = await TaskStorage.saveTasks(updatedTasks);
      
      if (saveSuccess) {
        setInputText(''); // Clear input field only on successful save
      } else {
        Alert.alert('Error', 'Failed to save task. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    }
  };

  /**
   * Toggle task completion status
   * @param {string} id - Task ID to toggle
   */
  const toggleTask = async (id) => {
    try {
      // Animate layout change
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      const updatedTasks = tasks.map(task =>
        task.id === id 
          ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
          : task
      );
      setTasks(updatedTasks);
      const saveSuccess = await TaskStorage.saveTasks(updatedTasks);
      
      if (!saveSuccess) {
        // Revert state on save failure
        setTasks(tasks);
        Alert.alert('Error', 'Failed to update task. Please try again.');
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  /**
   * Delete a task with confirmation dialog
   * @param {string} id - Task ID to delete
   */
  const deleteTask = (id) => {
    const taskToDelete = tasks.find(task => task.id === id);
    
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskToDelete?.text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Animate layout change
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              
              // Remove task from array and update storage
              const updatedTasks = tasks.filter(task => task.id !== id);
              setTasks(updatedTasks);
              const saveSuccess = await TaskStorage.saveTasks(updatedTasks);
              
              if (!saveSuccess) {
                // Revert state on save failure
                setTasks(tasks);
                Alert.alert('Error', 'Failed to delete task. Please try again.');
              }
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Calculate task statistics
   * @returns {Object} Task statistics
   */
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    return { total, completed, remaining };
  };

  /**
   * Render empty state component
   * @returns {JSX.Element} Empty state component
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-done-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyText}>No tasks yet</Text>
      <Text style={styles.emptySubtext}>Add a task to get started!</Text>
    </View>
  );

  const stats = getTaskStats();

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render method
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
      {/* Status bar configuration */}
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header section with title and task counter */}
      <View style={styles.header}>
        <Text style={styles.title}>Task Manager</Text>
        <Text style={styles.subtitle}>
          {stats.remaining} of {stats.total} tasks remaining
        </Text>
      </View>

      {/* Input section for adding new tasks */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={addTask} // Allow adding task by pressing Enter
          returnKeyType="done"
          maxLength={100} // Limit task length
          multiline={false}
        />
        <TouchableOpacity 
          style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]} 
          onPress={addTask}
          disabled={!inputText.trim()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Task list with empty state */}
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={tasks.length === 0 ? styles.emptyListContainer : null}
      />
      </Animated.View>
    </SafeAreaView>
  );
}

// Stylesheet - organized by component sections
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light gray background
  },
  animatedContainer: {
    flex: 1,
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  
  // Header section styles
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50', // Dark blue-gray
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d', // Medium gray
  },
  
  // Input section styles
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed', // Light border
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#3498db', // Blue
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1 }],
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7', // Disabled gray
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Task list styles
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#bdc3c7', // Light gray
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#bdc3c7',
    marginTop: 4,
  },
});