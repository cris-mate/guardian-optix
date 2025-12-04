import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  FiClipboard,
  FiChevronRight,
  FiFlag,
  FiCheck,
  FiSquare,
  FiCheckSquare,
  FiRefreshCw,
} from 'react-icons/fi';
import type { Task, TaskPriority, TaskFrequency } from '../types/dashboard.types';

// ============================================
// Types
// ============================================

interface UpcomingTasksProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  maxVisible?: number;
}

// ============================================
// Priority Configuration
// ============================================

const priorityConfig: Record<TaskPriority, {
  colorPalette: string;
  icon: React.ElementType;
  label: string;
}> = {
  high: {
    colorPalette: 'red',
    icon: FiFlag,
    label: 'High',
  },
  medium: {
    colorPalette: 'orange',
    icon: FiFlag,
    label: 'Medium',
  },
  low: {
    colorPalette: 'gray',
    icon: FiFlag,
    label: 'Low',
  },
};

const frequencyConfig: Record<TaskFrequency, {
  colorPalette: string;
  label: string;
}> = {
  once: { colorPalette: 'gray', label: 'One-time' },
  hourly: { colorPalette: 'blue', label: 'Hourly' },
  periodic: { colorPalette: 'purple', label: 'Periodic' },
};

// ============================================
// Custom Checkbox Button Component
// ============================================

interface TaskCheckboxProps {
  isChecked: boolean;
  onChange: () => void;
  isDisabled?: boolean;
}

const TaskCheckbox: React.FC<TaskCheckboxProps> = ({ isChecked, onChange, isDisabled }) => (
  <button
    type="button"
    onClick={(e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isDisabled) onChange();
    }}
    disabled={isDisabled}
    style={{
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      padding: '4px',
      borderRadius: '6px',
      border: 'none',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon
      as={isChecked ? FiCheckSquare : FiSquare}
      boxSize={5}
      color={isChecked ? 'green.500' : 'gray.400'}
    />
  </button>
);

// ============================================
// Task Item Component
// ============================================

interface TaskItemProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onClick, onComplete }) => {
  const priorityCfg = priorityConfig[task.priority];
  const frequencyCfg = frequencyConfig[task.frequency];
  const isCompleted = task.completed;

  return (
    <Box
      p={4}
      bg={isCompleted ? 'gray.50' : 'white'}
      borderWidth="1px"
      borderColor={isCompleted ? 'gray.200' : task.priority === 'high' ? 'orange.200' : 'gray.200'}
      borderRadius="lg"
      transition="all 0.2s"
      _hover={{
        borderColor: 'blue.300',
        boxShadow: 'sm',
      }}
    >
      <HStack align="flex-start" gap={3}>
        {/* Checkbox */}
        <TaskCheckbox
          isChecked={isCompleted}
          onChange={() => onComplete?.()}
          isDisabled={isCompleted}
        />

        {/* Content */}
        <VStack
          align="flex-start"
          flex={1}
          gap={2}
          cursor={onClick ? 'pointer' : 'default'}
          onClick={onClick}
        >
          <HStack justify="space-between" w="full" flexWrap="wrap" gap={2}>
            <HStack gap={2} flexWrap="wrap">
              <Text
                fontWeight="medium"
                fontSize="sm"
                textDecoration={isCompleted ? 'line-through' : 'none'}
                color={isCompleted ? 'gray.400' : 'gray.800'}
              >
                {task.title || task.description}
              </Text>
              <Badge
                colorPalette={priorityCfg.colorPalette}
                size="sm"
                variant="subtle"
              >
                <HStack gap={1}>
                  <Icon as={priorityCfg.icon} boxSize={3} />
                  <Text>{priorityCfg.label}</Text>
                </HStack>
              </Badge>
            </HStack>
            <Badge
              colorPalette={isCompleted ? 'green' : frequencyCfg.colorPalette}
              variant={isCompleted ? 'solid' : 'subtle'}
              size="sm"
            >
              {isCompleted ? 'Completed' : frequencyCfg.label}
            </Badge>
          </HStack>

          {/* Show description if title exists */}
          {task.title && task.description && (
            <Text
              fontSize="xs"
              color="gray.500"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              maxW="full"
            >
              {task.description}
            </Text>
          )}

          <HStack gap={4} flexWrap="wrap">
            {/* Frequency indicator */}
            {task.frequency !== 'once' && (
              <HStack gap={1}>
                <Icon as={FiRefreshCw} boxSize={3} color="gray.400" />
                <Text fontSize="xs" color="gray.500">
                  {task.frequency === 'hourly' ? 'Every hour' : 'Periodic'}
                </Text>
              </HStack>
            )}

            {/* Completed timestamp */}
            {task.completedAt && (
              <HStack gap={1}>
                <Icon as={FiCheck} boxSize={3} color="green.500" />
                <Text fontSize="xs" color="gray.500">
                  Completed {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({
                                                       tasks,
                                                       onTaskClick,
                                                       onTaskComplete,
                                                       maxVisible = 5,
                                                     }) => {
  const navigate = useNavigate();

  // Filter to pending tasks and sort by priority
  const pendingTasks = tasks.filter((t) => !t.completed);
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const visibleTasks = sortedTasks.slice(0, maxVisible);
  const highPriorityCount = pendingTasks.filter((t) => t.priority === 'high').length;

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={highPriorityCount > 0 ? 'orange.200' : 'gray.200'}
      boxShadow="sm"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={2}>
          <Icon as={FiClipboard} color="blue.500" />
          <Text fontWeight="semibold" color="gray.800">
            Pending Tasks
          </Text>
          {highPriorityCount > 0 && (
            <Badge colorPalette="orange" variant="subtle">
              {highPriorityCount} high priority
            </Badge>
          )}
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="blue"
          onClick={() => navigate('/scheduling')}
        >
          View All
          <Icon as={FiChevronRight} ml={1} />
        </Button>
      </HStack>

      {/* Task List */}
      {pendingTasks.length === 0 ? (
        <Box py={8} textAlign="center">
          <Icon as={FiCheck} boxSize={8} color="green.300" mb={2} />
          <Text color="gray.500" fontSize="sm">All caught up!</Text>
          <Text color="gray.400" fontSize="xs">No pending tasks</Text>
        </Box>
      ) : (
        <VStack gap={3} align="stretch">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onClick={onTaskClick ? () => onTaskClick(task) : undefined}
              onComplete={onTaskComplete ? () => onTaskComplete(task._id) : undefined}
            />
          ))}
        </VStack>
      )}

      {/* Show more */}
      {pendingTasks.length > maxVisible && (
        <Box mt={3} textAlign="center">
          <Button
            size="sm"
            variant="ghost"
            colorPalette="gray"
            onClick={() => navigate('/scheduling')}
          >
            View {pendingTasks.length - maxVisible} more tasks
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UpcomingTasks;