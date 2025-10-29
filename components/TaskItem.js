import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * TaskItem Component - Renders individual task with actions
 * @param {Object} props - Component props
 * @param {Object} props.item - Task object
 * @param {Function} props.onToggle - Function to toggle task completion
 * @param {Function} props.onDelete - Function to delete task
 */
const TaskItem = ({ item, onToggle, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Animate completion state
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: item.completed ? 0.6 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [item.completed]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[
      styles.taskItem,
      {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }
    ]}>
      {/* Task content - tap to toggle completion */}
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => onToggle(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Toggle task: ${item.text}`}
      >
        {/* Completion status icon */}
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.completed ? '#4CAF50' : '#757575'}
        />
        {/* Task text with conditional styling */}
        <Text style={[styles.taskText, item.completed && styles.completedTask]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      
      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Delete task: ${item.text}`}
      >
        <Ionicons name="trash-outline" size={20} color="#F44336" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default TaskItem;