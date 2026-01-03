/**
 * useSocket Hook
 *
 * Manages Socket.io connection with automatic reconnection,
 * authentication, and event subscription.
 *
 * Only connects when user is authenticated (has token).
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// ============================================
// Types
// ============================================

export interface SocketConfig {
  autoConnect?: boolean;
  enableLogging?: boolean;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  on: <T>(event: string, callback: (data: T) => void) => () => void;
  off: (event: string) => void;
}

// ============================================
// Constants
// ============================================

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// ============================================
// Hook Implementation
// ============================================

export const useSocket = (config: SocketConfig = {}): UseSocketReturn => {
  const { autoConnect = true, enableLogging = false } = config;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token from storage
  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Logging helper
  const log = useCallback(
    (...args: unknown[]) => {
      if (enableLogging) {
        console.log('[Socket]', ...args);
      }
    },
    [enableLogging]
  );

  // Connect to socket server
  const connect = useCallback(() => {
    const token = getToken();

    if (!token) {
      log('No token available, skipping socket connection');
      setError('No authentication token');
      return;
    }

    if (socketRef.current?.connected) {
      log('Already connected');
      return;
    }

    // Clean up any existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    setIsConnecting(true);
    setError(null);

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection events
    socketRef.current.on('connect', () => {
      log('Connected:', socketRef.current?.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      log('Disconnected:', reason);
      setIsConnected(false);

      // Don't show error for intentional disconnects
      if (reason === 'io client disconnect') {
        setError(null);
      }
    });

    socketRef.current.on('connect_error', (err) => {
      log('Connection error:', err.message);
      setError(err.message);
      setIsConnecting(false);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setError(null);
    });

    socketRef.current.on('reconnect_failed', () => {
      log('Reconnection failed');
      setError('Unable to reconnect to server');
    });
  }, [getToken, log]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
      log('Manually disconnected');
    }
  }, [log]);

  // Emit event
  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
        log('Emitted:', event, data);
      } else {
        log('Cannot emit, socket not connected');
      }
    },
    [log]
  );

  // Subscribe to event
  const on = useCallback(
    <T>(event: string, callback: (data: T) => void): (() => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
        log('Subscribed to:', event);
      }

      // Return unsubscribe function
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
          log('Unsubscribed from:', event);
        }
      };
    },
    [log]
  );

  // Unsubscribe from event
  const off = useCallback(
    (event: string) => {
      if (socketRef.current) {
        socketRef.current.off(event);
        log('Removed all listeners for:', event);
      }
    },
    [log]
  );

  // Auto-connect on mount (only if token exists)
  useEffect(() => {
    const token = getToken();

    // Only auto-connect if enabled AND user is authenticated
    if (autoConnect && token) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect, connect, getToken]);

  // Listen for token changes (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue && autoConnect) {
          // Token added (login) - connect
          connect();
        } else if (!e.newValue) {
          // Token removed (logout) - disconnect
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};

// ============================================
// Dashboard Socket Event Types
// ============================================

export interface ClockActionData {
  guardId: string;
  guardName: string;
  action: string;
  siteName: string;
  timestamp: string;
}

export interface GeofenceViolationData {
  severity: string;
  guardName: string;
  siteName: string;
  timestamp: string;
}

export interface IncidentReportedData {
  incidentId: string;
  type: string;
  severity: string;
  timestamp: string;
}

export interface ShiftUpdateData {
  shiftId: string;
  status: string;
  guardName: string;
  timestamp: string;
}

export interface MetricsUpdateData {
  metrics: unknown;
  timestamp: string;
}

export interface DashboardSocketEvents {
  onMetricsUpdate?: (data: MetricsUpdateData) => void;
  onClockAction?: (data: ClockActionData) => void;
  onShiftUpdate?: (data: ShiftUpdateData) => void;
  onActivityNew?: (data: unknown) => void;
  onAlertGeofence?: (data: GeofenceViolationData) => void;
  onIncidentReported?: (data: IncidentReportedData) => void;
}

// ============================================
// Dashboard Socket Hook
// ============================================

export const useDashboardSocket = (events: DashboardSocketEvents) => {
  const { socket, isConnected, on } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const cleanups: (() => void)[] = [];

    if (events.onMetricsUpdate) {
      cleanups.push(on('dashboard:metrics-updated', events.onMetricsUpdate));
    }

    if (events.onClockAction) {
      cleanups.push(on('timeClock:action', events.onClockAction));
    }

    if (events.onShiftUpdate) {
      cleanups.push(on('shift:status-changed', events.onShiftUpdate));
    }

    if (events.onActivityNew) {
      cleanups.push(on('activity:new', events.onActivityNew));
    }

    if (events.onAlertGeofence) {
      cleanups.push(on('alert:geofence-violation', events.onAlertGeofence));
    }

    if (events.onIncidentReported) {
      cleanups.push(on('incident:reported', events.onIncidentReported));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [isConnected, on, events]);

  return { socket, isConnected };
};

// ============================================
// Guard Tracking Hook (Manager/Admin only)
// ============================================

export interface GuardLocation {
  guardId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  geofenceStatus: 'inside' | 'outside' | 'unknown';
  timestamp: string;
}

export const useGuardTracking = (
  onLocationUpdate: (data: GuardLocation) => void
) => {
  const { socket, isConnected, emit, on } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to tracking updates
    emit('subscribe:guard-tracking');

    const cleanup = on<GuardLocation>('guard:location-updated', onLocationUpdate);

    return () => {
      emit('unsubscribe:guard-tracking');
      cleanup();
    };
  }, [isConnected, emit, on, onLocationUpdate]);

  return { isConnected };
};

// ============================================
// Personal Alerts Hook (All Users)
// ============================================

export const usePersonalAlerts = (
  onAlert: (data: { type: string; message: string }) => void
) => {
  const { isConnected, on } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const cleanup = on<{ type: string; message: string }>('alert:personal', onAlert);

    return () => cleanup();
  }, [isConnected, on, onAlert]);
};

export default useSocket;