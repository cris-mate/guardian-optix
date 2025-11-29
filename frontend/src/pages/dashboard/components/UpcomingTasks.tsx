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
  FiClock,
  FiMapPin,
  FiUser,
  FiFlag,
  FiCheck,
  FiSquare,
  FiCheckSquare,
} from 'react-icons/fi';
import type { Task, TaskPriority, TaskStatus } from '../types/dashboard.types';

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
  colorScheme: string;
  icon: React.ElementType;
  label: string;
}> = {
  high: {
    colorScheme: 'red',
    icon: FiFlag,
    label: 'High',
  },
  medium: {
    colorScheme: 'orange',
    icon: FiFlag,
    label: 'Medium',
  },
  low: {
    colorScheme: 'gray',
    icon: FiFlag,
    label: 'Low',
  },
};

const statusConfig: Record<TaskStatus, {
  colorScheme: string;
  label: string;
}> = {
  pending: { colorScheme: 'gray', label: 'Pending' },
  'in-progress': { colorScheme: 'blue', label: 'In Progress' },
  completed: { colorScheme: 'green', label: 'Completed' },
  overdue: { colorScheme: 'red', label: 'Overdue' },
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
  const statusCfg = statusConfig[task.status];

  const formatDueDate = (dueDate: Date | string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isDueSoon = !isOverdue && new Date(task.dueDate).getTime() - new Date().getTime() < 86400000 * 2;
  const isCompleted = task.status === 'completed';

  return (
    <Box
      p={4}
      bg={isOverdue ? 'red.50' : isDueSoon ? 'orange.50' : 'white'}
      borderWidth="1px"
      borderColor={isOverdue ? 'red.200' : isDueSoon ? 'orange.200' : 'gray.200'}
      borderRadius="lg"
      transition="all 0.2s"
      _hover={{
        borderColor: isOverdue ? 'red.300' : 'blue.300',
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
                {task.title}
              </Text>
              <Badge
                colorScheme={priorityCfg.colorScheme}
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
              colorScheme={isOverdue ? 'red' : statusCfg.colorScheme}
              variant={isOverdue ? 'solid' : 'subtle'}
              size="sm"
            >
              {isOverdue ? 'Overdue' : statusCfg.label}
            </Badge>
          </HStack>

          {task.description && (
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
            {/* Due Date */}
            <HStack gap={1}>
              <Icon
                as={FiClock}
                boxSize={3}
                color={isOverdue ? 'red.500' : isDueSoon ? 'orange.500' : 'gray.400'}
              />
              <Text
                fontSize="xs"
                color={isOverdue ? 'red.600' : isDueSoon ? 'orange.600' : 'gray.500'}
                fontWeight={isOverdue || isDueSoon ? 'medium' : 'normal'}
              >
                {formatDueDate(task.dueDate)}
              </Text>
            </HStack>

            {/* Assigned To */}
            {task.assignedTo && (
              <HStack gap={1}>
                <Icon as={FiUser} boxSize={3} color="gray.400" />
                <Text fontSize="xs" color="gray.500">
                  {task.assignedTo.name}
                </Text>
              </HStack>
            )}

            {/* Site */}
            {task.site && (
              <HStack gap={1}>
                <Icon as={FiMapPin} boxSize={3} color="gray.400" />
                <Text fontSize="xs" color="gray.500">
                  {task.site.name}
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

  // Sort tasks: overdue first, then by priority, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const aOverdue = new Date(a.dueDate) < new Date() && a.status !== 'completed';
    const bOverdue = new Date(b.dueDate) < new Date() && b.status !== 'completed';

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const visibleTasks = sortedTasks.slice(0, maxVisible);
  const overdueCount = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={overdueCount > 0 ? 'red.200' : 'gray.200'}
      boxShadow="sm"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={2}>
          <Icon as={FiClipboard} color="blue.500" />
          <Text fontWeight="semibold" color="gray.800">
            Pending Tasks
          </Text>
          {overdueCount > 0 && (
            <Badge colorScheme="red" variant="solid">
              {overdueCount} overdue
            </Badge>
          )}
          {highPriorityCount > 0 && overdueCount === 0 && (
            <Badge colorScheme="orange" variant="subtle">
              {highPriorityCount} high priority
            </Badge>
          )}
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          colorScheme="blue"
          onClick={() => navigate('/tasks')}
        >
          View All
          <Icon as={FiChevronRight} ml={1} />
        </Button>
      </HStack>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Box py={8} textAlign="center">
          <Icon as={FiCheck} boxSize={8} color="green.300" mb={2} />
          <Text color="gray.500" fontSize="sm">All caught up!</Text>
          <Text color="gray.400" fontSize="xs">No pending tasks</Text>
        </Box>
      ) : (
        <VStack gap={3} align="stretch">
          {visibleTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onClick={onTaskClick ? () => onTaskClick(task) : undefined}
              onComplete={onTaskComplete ? () => onTaskComplete(task.id) : undefined}
            />
          ))}
        </VStack>
      )}

      {/* Show more */}
      {tasks.length > maxVisible && (
        <Box mt={3} textAlign="center">
          <Button
            size="sm"
            variant="ghost"
            colorScheme="gray"
            onClick={() => navigate('/tasks')}
          >
            View {tasks.length - maxVisible} more tasks
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UpcomingTasks;